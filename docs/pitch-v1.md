# T-32 — Naskah pitch v1 (Bagian 12 PRD versi v1.1)

Draf v1 oleh agen AI, 2026-10-26. Struktur mengikuti naskah 3 menit (12.1);
jawaban juri memakai 12.2. Bagian bertanda [PM] menunggu keputusan/isi PM
(jawaban panitia T-37, tagline final). Total target: 3 menit bicara.

## Naskah 3 menit

### 0:00–0:15 — Pembuka

> "Setiap proyek jalan punya papan: nilai kontrak, kontraktor, masa kerja.
> Hampir tidak ada yang mencocokkannya dengan catatan resmi. Sekarang papan
> itu punya kode QR. Pindai, dan jawabannya ada di ponsel Anda."

*(Tunjukkan papan tiruan ber-QR; siapkan ponsel dengan kamera.)*

### 0:15–0:45 — Masalah

> "Data pengadaan sebenarnya sudah terbuka — di Indonesia ada ratusan ribu
> catatan lelang publik. Tetapi data itu tidak terhubung dengan benda yang
> ada di depan mata warga. Warga lewat di depan papan setiap hari dan tidak
> punya cara memeriksanya. Jarak dari papan ke data masih terlalu jauh:
> butuh tahu istilah, tahu situsnya, dan sabar mencari. Teralur menutup
> jarak itu dengan satu tindakan yang sudah jadi kebiasaan: memindai QR."

### 0:45–1:45 — Demo *(jalur utama: pindai QR papan tiruan)*

1. **Pindai QR** pada papan tiruan → dossier proyek terbuka langsung di
   ponsel, tanpa login, tanpa langkah perantara.
2. Tunjukkan **pita simulasi** di atas halaman — hitam-kuning, tidak bisa
   disembunyikan.
3. **Chip status**: "Cocok dengan catatan resmi" (atau "Selisih data, perlu
   klarifikasi" — pakai kasus Selisih kalau juri minta contoh masalah).
4. **Cincin waktu**: "Hari ke-76 dari 90" — hitungan hari sejak kontrak,
   bukan klaim kemajuan fisik.
5. **Label tiga status + jejak sumber**: buka satu angka, tunjukkan mana
   FAKTA / HITUNGAN / BELUM DIKETAHUI dan dari mana datanya (Opentender ICW,
   berlisensi terbuka).
6. **Resource**: buka satu foto/dokumen pendukung yang diunggah pengelola.
7. **Laporan warga**: tunjukkan penghitung per keadaan — "belum diverifikasi",
   tanpa persentase.
8. Singkat saja — **panel admin**: ubah proyek (form dua blok, pratinjau
   status dihitung otomatis), unggah resource, unduh QR untuk dicetak.
9. Bonus kalau ada waktu: **/jelajah** — peta proyek + pindai QR langsung
   dari peramban tanpa aplikasi kamera.

*(Cadangan bila QR/ponsel bermasalah: buka `/examples/demo-001` — salinan
statis yang terbuka tanpa basis data; lalu video cadangan 3 menit.)*

### 1:45–2:15 — Kejujuran kami

> "Kami bermain jujur. Data di demo ini simulasi buatan tim dan itu
> dinyatakan di setiap halaman — pita hitam di atas tidak bisa dimatikan
> oleh pengelola sekalipun. Setiap angka membawa tepat satu dari tiga label:
> fakta, hitungan, atau belum diketahui. Setiap informasi punya jejak sumber
> dan tanggal data. Tidak ada klaim kemajuan fisik — kami hanya menunjukkan
> waktu berjalan dan laporan warga yang belum diverifikasi. Dan ada alamat
> koreksi: siapa pun bisa meminta klarifikasi."

### 2:15–2:40 — Arah lanjut

> "Produk ini siap menerima data resmi: alur impor Opentender Tangerang
> sudah berjalan dengan 5.090 catatan pekerjaan, jadi data simulasi bisa
> diganti tanpa mengubah produk. Ekstraksi foto papan dengan AI sudah kami
> uji dan dibekukan sebagai langkah berikutnya — selalu dengan konfirmasi
> pengguna sebelum data dipakai. Dan laporan warga bisa naik level menjadi
> laporan terverifikasi."

### 2:40–3:00 — Penutup

> "Teralur: mulai dari papan, bukan dari database. Satu pindaian QR,
> warga mendapat laporan yang jujur tentang proyek yang memakai uangnya."
> *(tagline final [PM: konfirmasi/ubah])*

## Catatan teknis demo

- Kasus yang disiapkan: satu **Cocok** (demo-001) dan satu **Selisih**
  (demo-002); keduanya juga tersedia sebagai salinan statis `/examples/…`.
- Jalur demo utama butuh domain produksi + `NEXT_PUBLIC_SITE_URL` final agar
  QR berisi URL yang benar (T-27/T-48) — di localhost, QR memakai
  `http://localhost:3000`.
- Pita simulasi tidak dapat dimatikan dari admin (KP F-15).

## Pertanyaan juri — ringkasan jawaban (lengkap di PRD 12.2)

| Pertanyaan | Inti jawaban |
| --- | --- |
| Mengapa datanya simulasi? | Sesuai kesepakatan lomba [PM: isi jawaban panitia T-37]; alur impor data resmi sudah berjalan, simulasi bisa diganti tanpa mengubah produk |
| Mengapa tidak memakai AI? | Alur QR tidak membutuhkannya; ekstraksi foto sudah diuji dan dibekukan sebagai arah lanjut dengan konfirmasi wajib |
| Tingkat kecocokan? | Pada data simulasi status dihitung deterministik dan diuji unit; angka uji pada data nyata ada di `docs/t10-results.md` (dengan catatan papan uji diturunkan dari catatan itu sendiri) |
| Selisih itu wajar, bukan? | Sering wajar (addendum) — karena itu teksnya "perlu klarifikasi", bukan tuduhan |
| Siapa yang bisa mengubah data? | Hanya email terdaftar (`ADMIN_EMAILS`); pendaftaran publik mati; sesi diperiksa di server |
| QR di papan palsu? | QR hanya tautan; dossier menyatakan data papan tidak diverifikasi dan QR tidak membuktikan keaslian papan |
| Bedanya dengan LPSE/Opentender? | Mereka mulai dari data; kami mulai dari papan di lapangan dan menghubungkannya lewat QR |
| Real-time? | Tidak — data bertanggal atau berlabel simulasi, dinyatakan di layar |
| Kemajuan fisik? | Belum diketahui; hanya waktu berjalan + laporan warga belum terverifikasi |
| Lisensi data? | Simulasi buatan sendiri; data nyata berlisensi terbuka dengan atribusi (ODbL, diverifikasi T-07) |

## Yang masih harus dilakukan PM sebelum gladi

- [ ] Isi jawaban panitia T-37 ke 12.2 baris pertama (menunggu kirim/tanya).
- [ ] Putuskan tagline final.
- [ ] Gladi 1 dengan stopwatch; catat waktu aktual per segmen.
- [ ] Setelah domain final: cetak papan tiruan (T-48) dan ulangi demo lewat QR asli.
