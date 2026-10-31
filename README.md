<div align="center">

<img src="public/TeralurLogo.svg" alt="Logo Teralur" width="96" />

# Teralur

Teralur membantu masyarakat menjelajahi proyek infrastruktur publik dan
membandingkan informasi dari papan proyek dengan catatan pengadaan yang
tersedia. Antarmuka utamanya berbahasa Indonesia, dan menjelaskan sumber serta
batasan data yang ditampilkan.

</div>

## Progress saat ini

- [x] Landing page (beranda) + halaman publik: jelajah proyek dengan peta & pin,
      pencarian, dossier proyek, bukti pendukung, metodologi, dan tentang
- [x] Cek papan proyek (`/check`): input manual + ekstraksi opsional dari foto,
      lalu pencocokan dengan catatan pengadaan
- [x] Pindai kode QR proyek (`/pindai`)
- [x] Autentikasi Supabase dengan peran server-side (pemerintah, kontraktor,
      admin)
- [x] Dasbor: daftar proyek, papan proyek per proyek (kelola, QR, ubah),
      laporan warga, peta, dan ringkasan
- [x] Halaman akun saya: identitas + peran, ganti kata sandi, dan keluar
- [x] Area admin: kelola proyek, resource, kode QR, laporan warga, dan akun
      kontraktor
- [x] Mode terang/gelap dengan transisi halus
- [x] API untuk pencarian, pencocokan, dossier, laporan kunjungan, dan
      administrasi
- [ ] Impor data pengadaan nyata: skrip `import:records` siap, menunggu file
      sumber resmi (belum disertakan di repositori)

## Fitur

- Jelajahi proyek, peta, hasil pencarian, dossier, dan bukti pendukung.
- Bandingkan detail papan yang diisi manual dengan catatan pengadaan.
- Area administrator untuk mengelola proyek, resource, kode QR, dan laporan
  kunjungan warga.
- Kelola akun kontraktor (dibuat oleh administrator) dan tetapkan setiap
  proyek ke satu kontraktor. Kontraktor hanya melihat proyek yang ditugaskan
  kepadanya.
- Ekstraksi detail papan dari foto secara opsional memakai model visi yang
  kompatibel. Pemrosesan foto nonaktif secara bawaan dan foto yang diunggah
  diproses di memori, tidak disimpan oleh aplikasi.
- Ganti tema terang/gelap lewat tombol eksplisit. Terang adalah bawaan;
  pergantiannya dianimasikan dengan View Transitions API bila didukung dan
  langsung berganti bila tidak.

## Peran dan penugasan proyek

Setiap akun memiliki peran yang tersimpan di sisi server pada tabel
`profiles`, yang diselesaikan pada setiap permintaan oleh
`src/lib/identitas.ts`. Peran tidak diambil dari cookie, sehingga tidak bisa
diubah dari peramban.

- **Pemerintah (government)** menetapkan proyek dan memilih kontraktor. Ia
  melihat setiap proyek di area kerjanya.
- **Kontraktor (contractor)** dibuat oleh administrator di konsol admin
  (email dan kata sandi awal). Dasbor kontraktor dan API-nya difilter
  berdasarkan `submissions.contractor_id`, sehingga hanya melihat proyek yang
  ditugaskan kepadanya — termasuk saat membuka papan proyek lewat URL.
- **Admin** mengelola konten situs: proyek, resource, kode QR, laporan, dan
  akun kontraktor.

Satu proyek ditugaskan ke paling banyak satu kontraktor. Nama penyedia yang
tercatat pada data proyek resmi (`penyedia`) terpisah dan tetap dipakai saat
membandingkan data papan dengan catatan pengadaan.

## Teknologi

- Next.js 16 App Router, React 19, dan TypeScript
- Tailwind CSS 4
- next-themes untuk toggle tema terang/gelap
- Supabase Auth dan Postgres
- Vitest dan ESLint

## Prasyarat

- Node.js yang kompatibel dengan versi yang dibutuhkan Next.js 16
- npm
- Proyek Supabase untuk fitur berbasis basis data

## Pengembangan lokal

1. Pasang dependensi:

   ```bash
   npm install
   ```

2. Salin template lingkungan ke file lingkungan lokal:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Isi nilai yang dijelaskan di bawah. Jaga file lingkungan lokal tetap
   privat; file tersebut tidak dimaksudkan untuk di-commit.

3. Terapkan migrasi SQL di `supabase/migrations/` ke proyek Supabase Anda,
   sesuai urutan nama file. Migrasi `0005_contractors.sql` wajib untuk akun
   kontraktor: migrasi tersebut menambah tabel `contractors` dan `profiles`
   (sumber peran setiap akun di sisi server) serta
   `submissions.contractor_id` (penugasan satu kontraktor).

4. Jalankan server pengembangan:

   ```bash
   npm run dev
   ```

5. Buka [http://localhost:3000](http://localhost:3000).

Halaman publik bisa berjalan tanpa basis data yang tersambung, tetapi
pencarian, pencocokan, administrasi proyek, dan laporan memerlukan konfigurasi
serta data Supabase yang relevan. Aplikasi mengembalikan galat penyiapan bila
layanan yang dibutuhkan belum dikonfigurasi.

### Variabel lingkungan

| Variabel | Kegunaan |
| --- | --- |
| `SUPABASE_URL` | URL proyek Supabase di sisi server. |
| `SUPABASE_SERVICE_ROLE_KEY` | Kunci service-role di sisi server untuk operasi basis data teristimewa. Jangan pernah terekspos sebagai variabel `NEXT_PUBLIC_*`. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase yang dipakai klien autentikasi peramban. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci anonim/publishable Supabase yang dipakai klien autentikasi peramban. |
| `IP_HASH_SALT` | Salt rahasia untuk pengenal pembatasan laju; wajib untuk endpoint yang dibatasi lajunya bila basis data dikonfigurasi. |
| `MODEL_API_KEY` | Opsional: kunci API untuk ekstraksi foto otomatis. Tanpa ini, pengguna dapat mengisi detail papan secara manual. |
| `MODEL_BASE_URL` | Opsional: base URL API yang kompatibel OpenAI. Bawaan: `https://api.openai.com/v1`. |
| `MODEL_NAME` | Pengenal model untuk penyedia visi yang dikonfigurasi. |
| `NEXT_PUBLIC_SITE_URL` | Origin situs publik yang dipakai untuk membuat tautan proyek dan kode QR. |
| `NEXT_PUBLIC_CORRECTION_EMAIL` | Opsional: alamat email publik untuk koreksi. |
| `ADMIN_EMAILS` | Daftar alamat email administrator, dipisah koma. Akun yang tercantum di sini diperlakukan `admin` meski tanpa baris `profiles`. |
| `PHOTO_FLOW_ENABLED` | Aktif secara bawaan; isi `false` untuk membekukan alur foto (tautan nav, /check, endpoint match dan extract sama-sama 404). |

Variabel dalam `.env.example` adalah pengaturan utama aplikasi.
`MODEL_BASE_URL` dan `MODEL_NAME` adalah pengaturan khusus penyedia yang
bersifat opsional.

Untuk skrip baris perintah yang memakai `tsx --env-file=.env`, buat juga file
`.env` privat dari `.env.example` dan isi nilai sisi server yang dibutuhkan.

## Rute aplikasi

### Halaman publik

- `/` — beranda
- `/jelajah` — jelajahi proyek
- `/search` — pencarian
- `/dossiers/[slug]` dan `/evidence/[slug]` — dossier dan bukti proyek
- `/examples` dan `/examples/[exampleId]` — contoh
- `/methodology` dan `/about` — metodologi dan informasi proyek
- `/check` — pemeriksaan papan; alur foto aktif secara bawaan dan bisa
  dibekukan dengan `PHOTO_FLOW_ENABLED=false`
- `/pindai` — pemindaian QR

### Dasbor dan administrasi

- `/login` — masuk
- `/dashboard` — dasbor proyek, laporan, peta, dan pengaturan
- `/dashboard/akun` — halaman akun untuk akun yang sedang masuk: identitas dan
  peran, ganti kata sandi, dan keluar
- `/admin` — manajemen proyek oleh administrator
- `/admin/login` — masuk administrator

### API

Route handler ada di `src/app/api/`. Termasuk endpoint untuk pencarian,
pencocokan, dossier, ekstraksi foto, laporan kunjungan, serta manajemen proyek
dan resource oleh administrator.

## Basis data dan data contoh

Terapkan migrasi di `supabase/migrations/` sebelum memakai fitur berbasis basis
data. Skrip seed demo menyisipkan proyek demonstrasi fiktif:

```bash
npm run seed:demo
```

Skrip ini memakai `.env` dan memerlukan `SUPABASE_URL` serta
`SUPABASE_SERVICE_ROLE_KEY`.

`npm run import:records` mengimpor catatan pengadaan dari
`data/raw/main_tangerang.csv` dan `data/raw/awards_tangerang.csv`. File sumber
ini tidak disertakan dalam repositori; peroleh dan tinjau data sumber resmi
sebelum menjalankan importir.

## Perintah berguna

| Perintah | Deskripsi |
| --- | --- |
| `npm run dev` | Jalankan server pengembangan lokal. |
| `npm run build` | Buat build produksi. |
| `npm run start` | Sajikan build produksi. |
| `npm run lint` | Jalankan ESLint. |
| `npm test` | Jalankan rangkaian Vitest. |
| `npm run create:admin` | Buat atau konfigurasi administrator memakai skrip lokal. |
| `npm run seed:demo` | Seed proyek demo fiktif ke Supabase. |
| `npm run import:records` | Impor file CSV pengadaan lokal ke Supabase. |

## Catatan privasi dan keamanan

- Jangan pernah commit `.env`, `.env.local`, atau kredensial nyata.
- Simpan `SUPABASE_SERVICE_ROLE_KEY` di sisi server.
- Ekstraksi foto memerlukan konfigurasi model yang eksplisit; foto tidak
  disimpan oleh aplikasi.
- Proyek demo bersifat fiktif. Jangan sajikan sebagai catatan pengadaan nyata.
