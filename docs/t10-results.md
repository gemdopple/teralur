# T-10 Hasil Evaluasi Pencocokan

## INTERIM — papan sintetis terhadap catatan resmi nyata; tabel final menunggu gold set lapangan

> Status: **Interim.** Foto gold set (12 papan, PRD §11.1) adalah pekerjaan lapangan
> yang ditunda tim (lihat catatan di atas `scripts/eval-match-smoke.ts`).
> a`npm run eval:gold` sudah siap: begitu `data/gold.csv` terisi, perintah yang sama
> menghasilkan tabel final. Sementara itu hasil di bawah berasal dari
> `npm run eval:match-smoke` — 100 catatan resmi nyata (records) dari Supabase,
> dengan papan sintetis yang dibangun dari catatan itu sendiri.

## Hasil smoke eval (`npm run eval:match-smoke`, dijalankan 2026-10-21)

Pool: 100 catatan resmi (`records`) dari data OCDS Tangerang yang sudah diimpor.

| Skenario papan | n | Cocok | Selisih | Tidak ditemukan | Kandidat teratas tepat sasaran |
| --- | --- | --- | --- | --- | --- |
| Papan asli (harus Cocok) | 100 | 100 | 0 | 0 | 100 (100,0%) |
| Nama dikurangi kata terakhir | 100 | 96 | 0 | 4 | 94 (94,0%) |
| Nilai 15% lebih tinggi | 100 | 5 | 0 | 95 | 0 (0,0%) |

Catatan: 5 kandidat "Cocok" pada skenario nilai 15% lebih tinggi adalah kandidat
nama-penyedia yang tetap lulus meski nilai gagal — konsisten dengan aturan status
§6.4 (Selisih = tepat satu komponen gagal). Presisi 0% di skenario ini mencerminkan
papan sintetis, bukan papan nyata.

Interpretasi untuk G-02 (provisional, lihat PRD §13.3):

- Papan yang menemukan catatan: 100/100 (asli) dan 96/100 (nama dipotong) — jauh di
  atas gerbang ≥ 4 dari 12, tetapi ini papan yang diturunkan dari catatan itu sendiri,
  jadi angka ini menguji mesin pencocokan, bukan keberadaan papan di data.
- Presisi kandidat teratas: 100% (asli) dan 94% (nama dipotong) — di atas gerbang ≥ 90%.
- Keputusan G-02 tetap ditunda sampai gold set lapangan 12 papan terisi.

## Hasil gold set (`npm run eval:gold`)

Belum dapat dijalankan: `data/gold.csv` masih kosong (lapangan ditunda).
Skrip menampilkan pesan jujur dan keluar dengan kode 0. Tabel per papan
(ekspektasi vs hasil, kandidat teratas, `id_catatan_resmi` ditemukan atau tidak,
ringkasan presisi dan ketersediaan per field) akan tercetak otomatis saat CSV terisi.

## Latensi Cari Paket (F-10, KP ≤ 2 detik)

Diukur dengan `npx tsx --env-file=.env scripts/measure-search-latency.ts`
(5 kata kunci nyata, endpoint `/api/search` pada `npm run dev`, 2026-10-21):

| q | filter tahun | hasil | waktu |
| --- | --- | --- | --- |
| jalan | — | 1 | 1022 ms |
| drainase | — | 5 | 885 ms |
| gedung sekolah | — | 2 | 115 ms |
| rehabilitasi jalan | 2023 | 10 | 61 ms |
| pembangunan pasar | — | 10 | 111 ms |

p95 = 1022 ms (permintaan pertama memuat cold start `next dev`) — **lulus target ≤ 2 s**.
Batas ≤ 10 hasil ditegakkan di RPC (`least(result_limit, 10)`). Teks hasil kosong
"Tidak ditemukan di data yang kami miliki. Coba kata kunci lain." diverifikasi ada di
`src/components/teralur/SearchForm.tsx`.
