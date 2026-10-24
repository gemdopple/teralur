# Catatan agen AI (v1.1, H7–H10)

Kumpulan penyimpangan antara Lampiran A–N dan kode repo yang sudah ada. Aturan Lampiran A: bila repo berbeda dari lampiran (nama file, nama fungsi, bentuk respons), **ikuti kode yang sudah ada**, lalu catat di sini. Keputusan sementara menunggu konfirmasi PM ditandai **[PM]**.

## Penyimpangan struktur yang diikuti dari repo

1. **Prefiks `src/`**: repo memakai `src/app`, `src/lib`, `src/components/teralur`, bukan `app/`, `lib/`, `components/` seperti usulan B.1. Semua path lampiran dipetakan dengan prefiks `src/`.
2. **`lib/auth.ts` → `src/lib/admin-auth.ts`**: nama mengikuti pola milik agen backend (`admin-*.ts`). Isi tetap sesuai Lampiran I.2 (`AuthError`, `getAdminUser`, `requireAdmin`, allowlist `ADMIN_EMAILS`).
3. **`lib/ring.ts` → `src/lib/cincin.ts`**: fungsi cincin v1.0 (`hitungCincin`, tiga keadaan) sudah ada dan diuji. Untuk Lampiran G.1 (empat keadaan termasuk `belum_mulai`/not_started, teks `caption`/`centerText`, sumber total/mulai) ditambahkan fungsi baru di file yang sama; fungsi lama tidak diubah agar jalur foto beku tetap lulus uji.
4. **`NEXT_PUBLIC_CONTACT_EMAIL` → `NEXT_PUBLIC_CORRECTION_EMAIL`**: `.env.example` v1.0 sudah memakai nama ini; dipertahankan.
5. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: `.env` lokal sudah mempunyai kunci anon dengan nama `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; kode memakai nama B.3 (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) dan `.env` lokal diberi dua baris dengan nilai sama.
6. **Status internal**: kolom `submissions.status` menyimpan nilai internal (`cocok`, `selisih`, `tidak_ditemukan`, `catatan_resmi`); pemetaan ke enum API (`matched`, `discrepancy`, `not_found`, `official_record`) tetap di `src/lib/api-contract.ts` seperti v1.0.
7. **Render dossier**: halaman dossier memakai `instant = false` + `connection()` (konvensi Next.js terpasang) untuk memblokir streaming agar `notFound()` menghasilkan HTTP 404 sungguhan — semangat C-06 (render dinamis) dipertahankan.
8. **Dependensi baru** dipasang orchestrator sesuai B.2 tanpa tambahan lain: `@supabase/ssr`, `qrcode`, `@types/qrcode` (dev), `sharp`. **[PM]** `sharp` 0.35.x dipakai di runtime Node untuk buang EXIF dan kecilkan gambar resource.
9. **Slug**: `createPublicSlug()` ada di `src/lib/server-api.ts` (base64url 12 karakter, dipakai jalur foto). Proyek admin memakai fungsi yang sama; slug tidak pernah dibuat ulang.

## Keputusan sementara **[PM]**

- (diisi agen per tugas; PM memindahkan yang perlu ke PRD 13.3)

## T-38 (gerbang jalur foto)

10. **Mode render gerbang flag**: `photoFlowEnabled()` di `/check`, beranda, dan SiteHeader dibaca **saat build** (build-time). Di `/check` dengan flag mati, `notFound()` terpanggil saat prerender sehingga rute jadi halaman statis yang melayani **HTTP 404 sungguhan** (bukan soft 404). Alasan: dokumen Next terpasang (`loading.md` → "Status codes") menyatakan respons streaming selalu mulai dengan 200; `notFound()` setelah stream mulai (mis. lewat `await connection()` runtime) hanya menghasilkan 200 + `<meta noindex>` (soft 404). Verifikasi dengan `next start`: flag off → `/check` = 404, beranda tanpa tautan `/check`; flag on (env saat build) → `/check` = 200 normal. Konsekuensi: mengubah flag memerlukan build ulang; di Vercel perubahan env memicu deploy baru sehingga semantiknya tetap benar. Bila nanti butuh toggle runtime (soft 404 cukup), bungkus konten `/check` dengan `<Suspense>` + `await connection()`.
11. **Catatan observasi** (di luar lingkup tugas ini): pola dossier (`instant = false` + `connection()`, catatan #7) pada build terpasang saat ini masih menghasilkan 200 + noindex untuk slug asing di `next start`, bukan 404 sungguhan — karena respons tetap streaming di mesin cacheComponents. Perilaku UI-nya netral dan noindex, jadi untuk demo cukup; perlu dikonfirmasi ulang agen backend bila status 404 asli disyaratkan.

## T-26 (metodologi + tentang)

12. **Statistik DB metodologi tidak lagi melempar galat**: hitungan catatan dan tanggal snapshot yang gagal kini didegradasi menjadi null (teks "bila basis data sudah terhubung"), bukan `throw`. Halaman metodologi harus tetap terbaca saat demo tanpa Supabase.

## Catatan T-39 (migrasi 0003 + auth admin)

1. **`.env` terlacak git**: `.gitignore` hanya mengecualikan `.env*.local`, sedangkan `.env` sudah ter-commit (B.3 mengasumsikan sebaliknya). `DEV_ADMIN_PASSWORD` ditulis ke `.env` lokal oleh `scripts/create-admin.ts` dan **tidak boleh ikut di-commit**; disarankan menambahkan `.env` ke `.gitignore` dan menghapus baris rahasia dari riwayat nanti. **[PM]**
2. **Verifikasi bucket Storage**: skema `storage` tidak diekspos ke PostgREST (`PGRST106`), dan Storage Admin REST API menolak kunci service-role warisan (`Invalid Compact JWS` — proyek ini memakai skema penandatanganan JWT baru). Bucket `resources` diverifikasi lewat `npx supabase db query --linked "select ... from storage.buckets"`. Aplikasi tetap memakai `getSupabaseAdmin()` dari `@supabase/supabase-js` untuk Storage (terbukti berfungsi untuk PostgREST).
3. **Pengerasan bucket (C.2)**: bucket `resources` dibuat `public = true` (baca publik; nama objek acak membuat URL tak terduga), `file_size_limit = 4194304`, `allowed_mime_types` = empat mime yang diizinkan — dibatasi dua lapis dengan kolom check `resources.ukuran`/`resources.tipe_mime`. Upsert bucket idempoten lewat `on conflict (id) do update`.
4. **`scripts/create-admin.ts`**: bila akun sudah ada, skrip me-reset kata sandi, memaksa `email_confirm`, dan mencabut ban (`ban_duration: "none"`) alih-alih gagal.
5. **`src/lib/admin-http.ts`**: `adminErrorResponse` mencetak error non-Auth ke `console.error` dan mengembalikan 500 `INTERNAL` generik tanpa detail internal, sesuai E.1.
6. **Skrip verifikasi** 0003 dijalankan sekali lalu dihapus dari repo (di luar pagar scope); hasilnya dicatat di laporan T-39, bukan di repo.


## Catatan T-38 lanjutan (compare, cincin G.1, dates, files, nilai-uang)

13. **`src/lib/match/trigram.ts` — padding trigram diubah ke Lampiran F.2** (dua spasi di depan, satu di belakang: `"  kata "`; sebelumnya `" kata "` satu-satu). Penyebab: 3 dari 5 vektor F.4 GAGAL dengan padding lama (`jalan melati` vs `jalan mawar` = 0,3125 alih-alih 0,3889; `karya bangun nusantara jaya` vs `karya bangun nusantara` = 0,8696 alih-alih 0,8519; `mitra sarana konstruksi` vs `mitra sarana teknik` = 0,4074 alih-alih 0,4194). Padding baru setara `pg_trgm.similarity()`; semua uji lama (termasuk `match.test.ts`) tetap lulus. **[PM: konfirmasi perubahan ini disengaja, bukan regresi]**
14. **`src/lib/nilai-uang.ts` — ditulis ulang sesuai Lampiran D.2** (nama fungsi tetap `parseNilaiUang`). Penyebab: 4 dari 10 vektor D.2 GAGAL dengan parser lama (`Rp. 875.000.000` → null alih-alih 875000000; `12.50` → 1250 alih-alih null; `1,5 miliar` → 1 alih-alih null; `0` → 0 alih-alih null). Perubahan: `rp` dibuang hanya di awal string (`^rp\.?\s*`), titik ribuan wajib berpola 1-3 digit + kelipatan 3 digit, desimal maks 2 digit di akhir, hasil wajib > 0. Semua uji lama tetap lulus.
15. **Lampiran G.1 dipetakan ke `src/lib/cincin.ts`**, bukan `lib/ring.ts` (lanjutan keputusan no. 3): ekspor baru `computeTimeRing`, `TimeRing`, `RingState`, `RingInput`, `RING_NOTE` dengan nama field Inggris sesuai G.1/E.11. Fungsi v1.0 (`hitungCincin`, `inputCincin`) tidak disentuh. Uji 10 vektor G.2 ditempatkan di `cincin.test.ts` (bukan `ring.test.ts` versi N.1), mengikuti nama berkas repo.
16. **Keputusan tepi `computeTimeRing`** (tidak disebut G.1): (a) masa ≤ 0 diperlakukan seperti kosong → `unknown` "Masa pelaksanaan tidak tersedia" (mencegah pembagian nol, konsisten `hitungCincin` v1.0); (b) `elapsedDays = 0` pada `not_started` (konsisten `centerText` "0/total"), `elapsedDays = null` pada `unknown`; (c) pada rule 3 (tanpa tanggal mulai) `totalDays`/`totalSource` tetap terisi bila masa diketahui — sifatnya informasional; (d) string tanggal diasumsikan sudah tervalidasi zod (`TTTT-BB-HH`) di hulu.
17. **`compare()` (Lampiran F.3)**: field teks dianggap terisi bila `trim() !== ""` (konsisten `src/lib/match/match.ts`); angka non-finite diperlakukan tidak terisi. `relativeDifference = |board − record| / record` persis C-10 (pembagi tanpa nilai mutlak; nilai record positif menurut skema, jadi ekuivalen `|record|`). Memakai `normalisasiTeks` (F.1: pakai normalisasi yang sudah ada dan lulus uji) dan `trigramSimilarity` dari `src/lib/match/`; ambang dan bobot dibaca dari `MATCH_CONFIG`.
18. **`src/lib/dates.ts` baru** (D.3 belum ada di repo): `jakartaToday`, `daysBetween`, `addDays`, `formatTanggal` persis D.3, murni (instant `now` lewat argumen, tanpa `Date.now()` di dalam). **`src/lib/files.ts`** persis J.1 (`detectFile`). Uji WIB boundary (16:59/17:00/18:00 UTC) dan 4 tanda tangan + 3 kasus null ada di `dates.test.ts`/`files.test.ts`.
