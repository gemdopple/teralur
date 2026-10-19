# Laporan cakupan data (T-07)

Sumber: Opentender ICW OCDS (lisensi ODbL) — unduhan 2026-10-20, subset wilayah Tangerang.
Berkas: `data/raw/main_tangerang.csv` + `data/raw/awards_tangerang.csv`. Snapshot bertanggal, bukan real-time.

## Ringkasan

| Metrik | Nilai |
| --- | --- |
| Total tender Tangerang (Kab. + Kota, tanpa Tangsel) | 9276 |
| Tender kategori `works` (konstruksi) | 5090 |
| Dengan tanggal kontrak (dari awards) | 4768 (93.7%) |
| Dengan nilai kontrak > 0 | 4768 (93.7%) |
| Dengan masa hari (durasi kontrak) | 0 (0%) — kolom durasi tidak tersedia di OCDS flattening ini; cincin waktu akan mengambil durasi dari papan (PRD 6.5) |
| Pembeli terbanyak | Pemerintah Daerah Kabupaten Tangerang · Pemerintah Daerah Kota Tangerang |

## Baris works per tahun (dari tanggal tender)

| Tahun | Works |
| --- | --- |
| 2014 | 1 |
| 2015 | 8 |
| 2016 | 672 |
| 2017 | 982 |
| 2018 | 855 |
| 2019 | 784 |
| 2021 | 503 |
| 2022 | 538 |
| 2023 | 747 |

## Gerbang G-01

Syarat: ≥ 100 catatan konstruksi di wilayah target. Tercatat **5090** baris `works` — lulus jauh di atas ambang. Keputusan dicatat di PRD 13.3.

## Syarat lisensi (A-06)

ODbL mengharuskan atribusi sumber ("Sumber: Opentender — data pengadaan Indonesia, ICW, ODbL") dan berbagi-serupa bila basis data didistribusikan ulang. Atribusi wajib tampil di footer dan kartu bukti (PRD 7.2, F-09, F-12). Tautan sumber: https://opentender.net

## Catatan untuk impor (T-08)

- Baris works tanpa award: 322 — tetap diimpor bila punya nama paket; nilai kosong menyaring diri sesuai 7.2.
- Bersihkan tanggal di luar 2015–(sekarang+5 tahun) jadi `null`; buang duplikat `id_sumber`.
