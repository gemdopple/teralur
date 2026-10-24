# Nama rekaan data simulasi (Lampiran M.1)

Semua nama di bawah adalah rekaan untuk data demo Teralur. Tidak ada nama orang.
Daftar ini dibuat sebelum seed dijalankan; setiap nama perusahaan diperiksa ke
mesin pencari (pencarian frasa dalam tanda kutip, 2026-10-24) untuk memastikan
tidak identik dengan entitas nyata. Nama yang identik dengan entitas nyata
DIGANTI, dan penggantinya diperiksa ulang dengan cara yang sama.

## Perusahaan / badan usaha

| Nama final | Dipakai di | Hasil pemeriksaan (kueri = nama dalam tanda kutip) |
| --- | --- | --- |
| PT Karya Bangun Nusantara Jaya | demo-001 (papan + resmi) | Aman. Kueri `"PT Karya Bangun Nusantara Jaya"` tidak menghasilkan entitas identik. Ada **PT Karya Bangun Nusantara** (Jakarta, tanpa "Jaya") — nama terdaftar berbeda, bukan identik. |
| CV Sinar Tirta Konstruksi | demo-002 (papan + resmi) | Aman. Kueri `"CV Sinar Tirta Konstruksi"` → tidak ada hasil. |
| PT Nagasari Cipta Graha | demo-003 (papan + resmi) | Aman (nama pengganti). Awalnya PRD memakai **PT Graha Mandala Persada**, tetapi halaman SEO junk menyebut "PT. Graha Mandala Persada" sebagai perusahaan konstruksi di Bontang — dianggap HIT dan diganti. Kueri `"PT Nagasari Cipta Graha"` → tidak ada entitas identik. |
| PT Lintas Bumi Karya | demo-004 (papan + resmi) | Aman. Kueri `"PT Lintas Bumi Karya"` → tidak ada entitas identik (yang ada: PT Lintas Bumi Sukses, PT Lintas Karya Sandang — berbeda). |
| CV Sagara Karya Utama | demo-005 (papan) | Aman (nama pengganti, lihat demo-005 resmi). Kueri `"CV Sagara Karya Utama"` → tidak ada entitas identik (yang mirip: CV Sagara Trading Corp, CV Sagara Inovasi, CV Sarana Karya Utama — berbeda). |
| PT Sagara Karya Teknik | demo-005 (resmi) | Aman (nama pengganti). Pasangan papan/resmi demo-005 asli (CV Mitra Sarana Konstruksi vs PT Mitra Sarana Teknik) keduanya HIT — **CV Mitra Sarana Konstruksi** tercatat di Direktori Konstruksi Sulsel 2025 (Sidenreng Rappang) dan **PT Mitra Sarana Teknik** adalah perusahaan fabrikasi nyata di Sukoharjo (LinkedIn/Instagram). Diganti berdua; kemiripan trigram pasangan baru 0,50 (< ambang penyedia 0,85) sehingga status demo tetap Selisih. Kueri `"PT Sagara Karya Teknik"` → tidak ada entitas identik (yang mirip: PT Sagara Teknik Mulia, PT Sagara Tehnik Indonesia — berbeda). |
| PT Adhi Pratama Sejahtera | demo-006 (papan + resmi) | Aman. Kueri `"PT Adhi Pratama Sejahtera"` → tidak ada entitas identik (yang mirip: PT Adhi Pratama Persada, PT Parama Adhi Pratama — berbeda). |
| CV Bumi Asri Perkasa | demo-007 (papan) | Aman. Kueri `"CV Bumi Asri Perkasa"` → tidak ada entitas identik (yang mirip: PT Bumi Asri Prima Perkasa — berbeda). |
| PT Cahaya Utama Teknik | demo-007 (resmi) | Aman. Kueri `"PT Cahaya Utama Teknik"` → tidak ada entitas identik "PT"; yang ada **CV Cahaya Utama Teknik** (prefiks badan usaha berbeda, nama terdaftar berbeda). Dicatat sebagai kemiripan dekat. |
| PT Rajawali Karya Abadi | demo-008 (resmi) | Aman. Kueri `"PT Rajawali Karya Abadi"` → tidak ada entitas identik (yang mirip: PT Rajawali Karya Perkasa, PT Rajawali Tunggal Abadi — berbeda). |
| PT Nusa Indah Konstruksi | demo-009 (papan + resmi) | Aman. Kueri `"PT Nusa Indah Konstruksi"` → tidak ada entitas identik (yang mirip: Nusa Indah Teknik, PT Nusa Indah Kontraktor Utama, CV Nusa Indah Tehnik — berbeda). |
| CV Tani Makmur Sendaya | demo-010 (papan + resmi) | Aman (nama pengganti). Awalnya PRD memakai **CV Karya Tani Sejahtera**, tetapi nama itu muncul sebagai penjual nyata di Tokopedia — dianggap HIT dan diganti. Kueri `"CV Tani Makmur Sendaya"` → tidak ada entitas identik (yang mirip: CV Tani Makmur Bengkulu, CV Tani Makmur Sejahtera Bersama — berbeda). |

## Instansi

- **Dinas Pekerjaan Umum Kota Tirtamulya** — instansi rekaan (M.1), dipakai sebagai
  `agencyUnit` seluruh baris seed. Tidak diperiksa mesin pencari karena gabungan
  nama wilayah rekaan; tidak ada "Kota Tirtamulya" di dunia nyata (lihat di bawah).

## Wilayah

- **Kota Tirtamulya** (kota)
- **Kabupaten Sumberlaras** (kabupaten)
- **Kecamatan Sukamaju** (kecamatan)
- **Desa Cibening** — dipakai dalam paket demo-004 sebagai "Desa Cibening Lembah"
- **Desa Tirtamulya** — dipakai dalam paket demo-002/006/010 sebagai "Desa Tirtamulya"
  dan "Ruas Tirtamulya Lembah"

Seluruh wilayah adalah rekaan sesuai M.1 dan tidak merujuk wilayah nyata; nama
"Desa Sukamaju" generik hanya muncul selalu bersama konteks rekaan Kota Tirtamulya.

## Catatan

- Pemeriksaan dilakukan 2026-10-24 lewat pencarian web frasa persis (hasil tercantum
  pada laporan T-43). Bila nama diganti lagi di masa depan, ulangi pemeriksaan dan
  perbarui tabel ini.
- `contractNumber` seed memakai pola `SIM/demo-0XX/2026` — bukan nama entitas.
