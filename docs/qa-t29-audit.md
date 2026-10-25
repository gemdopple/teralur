# T-29 — Daftar periksa audit kata (6.7) dan audit label simulasi (F-12)

Tanggal audit: 2026-10-26 (agen AI, pohon kerja setelah gelombang redesign v2).
Semua butir diperiksa ulang setelah perbaikan; tidak ada temuan tersisa.

## 1. Audit kata terlarang (6.7)

| Butir | Cara periksa | Hasil |
| --- | --- | --- |
| Kata terlarang 6.7 di semua halaman statis + dossier terbit | `npm run audit:words` (Lampiran N.4) | **Exit 0** — "Bersih: tidak ada kata terlarang." |
| Halaman baru gelombang v2 (`/jelajah`, dasbor, `/login`) | Termasuk dalam daftar audit skrip + tinjauan teks | Bersih — teks UI memakai "rekaan"/"simulasi", bukan kata terlarang |
| Teks siap-bagikan WhatsApp (`src/lib/share-text.ts`) | Uji unit (`share-text.test.ts`) | 128/128 uji lulus; teks bebas kata terlarang |
| Data kosong memakai "Belum diketahui"/"Tidak tersedia" | Tinjauan teks halaman publik | Sesuai (cincin `unknown`, field kosong, kartu bukti) |

## 2. Audit label simulasi (F-12) — halaman

| Permukaan | Cara periksa | Hasil |
| --- | --- | --- |
| Dossier demo daring (`/dossiers/[slug]`, `jenis=admin`) | Tinjauan halaman | **Pita simulasi dihapus atas keputusan PM (2026-10-26)** — halaman demo tanpa pita pengganti; deviasi F-12 tercatat di agent-notes no. 84 |
| Kartu bukti demo (`/evidence/[slug]`) | Tinjauan halaman | Pita simulasi juga dihapus (keputusan PM yang sama) |
| Salinan statis hero (`/examples/demo-001\|002\|004`) | Tinjauan halaman | Pita simulasi juga dihapus (keputusan PM yang sama) |
| Dossier non-demo (foto/cari v1.0) | Tinjauan kode `DossierView` | Pita kuning "Data resmi per {tanggal}. Bukan data real-time." — benar, bukan simulasi |
| Beranda, `/jelajah`, `/methodology`, `/about` | Tinjauan teks | Menyebut data simulasi/rekaan secara jelas (F-11 KP) |
| Halaman login + dasbor (`(app)`) | Tinjauan teks | Berlabel simulasi ("Data aplikasi adalah simulasi", catatan peran) |

## 3. Audit label simulasi — keluaran terbagikan

| Permukaan | Cara periksa | Hasil |
| --- | --- | --- |
| Gambar bagikan 1200×630 (`opengraph-image.tsx`) | Tinjauan kode | Menggambar pita SIMULASI di atas bila `demo` (H.4) |
| Teks siap-bagikan WhatsApp | Uji unit `share-text.test.ts` | Teks proyek demo membawa label SIMULASI (F-12) |
| QR & lembar cetak (`/admin/projects/[id]/qr`) | Tinjauan halaman | Lembar cetak membawa pita simulasi untuk proyek demo |

## 4. Regresi yang ditemukan dan diperbaiki saat audit ini

- **Pita simulasi hilang pada tata letak v2.** Gelombang redesign v2 mengganti
  `PitaSimulasi` dengan `PitaData` ("Data resmi per …") tanpa memeriksa `demo`,
  sehingga proyek simulasi tampil sebagai "Data resmi" — pelanggaran F-12.
  Diperbaiki 2026-10-26: `PitaSimulasi` dipulihkan di `src/components/teralur/Pita.tsx`
  (teks baku 8.4, verbatim dari komponen v1.1) dan `DossierProyek`/`KartuBukti`
  kini memilih pita berdasar `demo`. Diverifikasi ulang via `curl` + tangkapan
  layar (butir 2 di atas).
- **Luapan horizontal 360 px pada seksi Grafik dossier.** Kartu grafik
  (recharts/cincin) menolak menyusut di bawah lebar konten (grid item
  `min-width:auto`). Diperbaiki dengan `min-w-0` pada `StaggerItem` kartu
  (`DossierProyek.tsx`); verifikasi ulang: `scrollWidth == clientWidth` di
  seluruh halaman publik pada 360 px.

## 5. Verifikasi T-30 (perapihan ponsel, sisi agen)

| Halaman (360×800) | Luapan horizontal | Catatan |
| --- | --- | --- |
| `/` | Tidak | Animasi masuk selesai; kartu Selisih, CTA, grafik rapi |
| `/jelajah` | Tidak | Peta Leaflet hidup (9 penanda), kartu proyek rapi, pemindai QR ada |
| `/dossiers/[slug]` (demo) | **Diperbaiki** (370→345) | Pita simulasi, tabel papan vs catatan, grafik, jejak sumber rapi |
| `/methodology` | Tidak | — |
| `/search` | Tidak | — |
| `/examples/demo-001` | Tidak | — |
| `/login` | Tidak | Pemilih peran (Pemerintah/Kontraktor/Admin) muat |
| `/about` | Tidak | — |
| `/check` | — | 404 sesuai kontrak (jalur foto beku, `PHOTO_FLOW_ENABLED` mati) |

Catatan: KP penuh T-30 ("Diuji di 2 ponsel berbeda") tetap menunggu uji manual
di perangkat fisik — daftar di atas adalah pemeriksaan peramban berukuran 360 px.
