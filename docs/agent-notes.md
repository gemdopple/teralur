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

## Catatan T-39 (migrasi 0003 + auth admin)

1. **`.env` terlacak git**: `.gitignore` hanya mengecualikan `.env*.local`, sedangkan `.env` sudah ter-commit (B.3 mengasumsikan sebaliknya). `DEV_ADMIN_PASSWORD` ditulis ke `.env` lokal oleh `scripts/create-admin.ts` dan **tidak boleh ikut di-commit**; disarankan menambahkan `.env` ke `.gitignore` dan menghapus baris rahasia dari riwayat nanti. **[PM]**
2. **Verifikasi bucket Storage**: skema `storage` tidak diekspos ke PostgREST (`PGRST106`), dan Storage Admin REST API menolak kunci service-role warisan (`Invalid Compact JWS` — proyek ini memakai skema penandatanganan JWT baru). Bucket `resources` diverifikasi lewat `npx supabase db query --linked "select ... from storage.buckets"`. Aplikasi tetap memakai `getSupabaseAdmin()` dari `@supabase/supabase-js` untuk Storage (terbukti berfungsi untuk PostgREST).
3. **Pengerasan bucket (C.2)**: bucket `resources` dibuat `public = true` (baca publik; nama objek acak membuat URL tak terduga), `file_size_limit = 4194304`, `allowed_mime_types` = empat mime yang diizinkan — dibatasi dua lapis dengan kolom check `resources.ukuran`/`resources.tipe_mime`. Upsert bucket idempoten lewat `on conflict (id) do update`.
4. **`scripts/create-admin.ts`**: bila akun sudah ada, skrip me-reset kata sandi, memaksa `email_confirm`, dan mencabut ban (`ban_duration: "none"`) alih-alih gagal.
5. **`src/lib/admin-http.ts`**: `adminErrorResponse` mencetak error non-Auth ke `console.error` dan mengembalikan 500 `INTERNAL` generik tanpa detail internal, sesuai E.1.
6. **Skrip verifikasi** 0003 dijalankan sekali lalu dihapus dari repo (di luar pagar scope); hasilnya dicatat di laporan T-39, bukan di repo.

