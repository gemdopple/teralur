// T-43: seed data simulasi PRD v1.1 Lampiran M (10 proyek demo).
// Jalankan: npm run seed:demo  (tsx --env-file=.env)
// Perilaku (M.3):
//  - Menolak berjalan tanpa SUPABASE_SERVICE_ROLE_KEY.
//  - Upsert `records` pada (sumber='simulasi', id_sumber=kunci) — tanggal kontrak
//    resmi selalu dihitung ulang dari hari WIB sekarang + offset sehingga cincin
//    menampilkan keadaan yang sama bila dijalankan ulang di hari lain (M.3 no. 6).
//  - Proyek admin di `submissions` (jenis='admin', record_id=records.id): dibuat
//    bila belum ada (slug baru, sekali), diperbarui bila sudah ada — slug TIDAK
//    PERNAH disentuh. Status/skor dari compare() produksi (src/lib/compare.ts).
//  - Tidak menghapus baris apa pun; aman dijalankan berulang tanpa duplikat.
// Nama rekaan: lihat docs/demo-names.md (sudah diperiksa ke mesin pencari).
// CATATAN: tiga hero unggulan (demo-001/002/004) digandakan sebagai salinan
// statis di src/data/hero-dossiers.ts (T-28 mode cadangan); bila SEEDS di
// bawah diubah, berkas itu wajib diubah dengan nilai yang sama.

import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { addDays, jakartaToday } from "../src/lib/dates";
import { normalisasiTeks } from "../src/lib/match/normalisasi";
import { compare } from "../src/lib/compare";
import { boardToInternal, statusToInternal } from "../src/lib/api-contract";

// M.1: kolom yang tidak tercantum pada tabel M.2.
const TAHUN_ANGGARAN = 2026;
const SUMBER_DANA = "APBD 2026";
const INSTANSI = "Dinas Pekerjaan Umum Kota Tirtamulya";

type SeedSpec = {
  kunci: string;
  // Sisi papan (signboard). demo-008 sengaja hanya punya nama paket.
  board: {
    packageName: string | null;
    supplier: string | null;
    contractValue: number | null;
    durationDays: number | null;
  };
  // Sisi catatan resmi (selalu lengkap: tiga field wajib C-05).
  official: {
    packageName: string;
    supplier: string;
    contractValue: number;
    durationDays: number | null;
  };
  // Offset hari mulai kontrak dari hari seed; null = tanpa tanggal (demo-003).
  offsetHari: number | null;
  lokasi: string;
  terbit: boolean;
  unggulan: boolean;
};

// Nilai dari tabel M.2 (hasil dihitung dengan implementasi acuan). Nama yang
// tercantum PRD tapi identik dengan entitas nyata sudah diganti — lihat
// docs/demo-names.md (demo-003, demo-005, demo-010).
const SEEDS: SeedSpec[] = [
  {
    kunci: "demo-001",
    board: { packageName: "Rehabilitasi Jalan Lingkungan Melati Raya Kecamatan Sukamaju", supplier: "PT Karya Bangun Nusantara Jaya", contractValue: 1_485_000_000, durationDays: 90 },
    official: { packageName: "Rehabilitasi Jalan Lingkungan Melati Raya Kecamatan Sukamaju", supplier: "PT KARYA BANGUN NUSANTARA JAYA", contractValue: 1_485_000_000, durationDays: 90 },
    offsetHari: -74,
    lokasi: "Kecamatan Sukamaju",
    terbit: true,
    unggulan: true,
  },
  {
    kunci: "demo-002",
    board: { packageName: "Pembangunan Drainase Primer Jalan Kenanga Desa Tirtamulya", supplier: "CV Sinar Tirta Konstruksi", contractValue: 875_000_000, durationDays: 120 },
    official: { packageName: "Pembangunan Drainase Primer Jalan Kenanga Desa Tirtamulya", supplier: "CV Sinar Tirta Konstruksi", contractValue: 912_500_000, durationDays: 120 },
    offsetHari: -45,
    lokasi: "Desa Tirtamulya",
    terbit: true,
    unggulan: true,
  },
  {
    kunci: "demo-003",
    board: { packageName: "Pembangunan Gedung Puskesmas Pembantu Desa Sumberlaras", supplier: "PT Nagasari Cipta Graha", contractValue: 2_640_000_000, durationDays: 180 },
    official: { packageName: "Pembangunan Gedung Puskesmas Pembantu Desa Sumberlaras", supplier: "PT Nagasari Cipta Graha", contractValue: 2_640_000_000, durationDays: 180 },
    offsetHari: null,
    lokasi: "Desa Sumberlaras",
    terbit: true,
    unggulan: false,
  },
  {
    kunci: "demo-004",
    board: { packageName: "Peningkatan Jalan Poros Desa Cibening Lembah", supplier: "PT Lintas Bumi Karya", contractValue: 3_120_000_000, durationDays: 90 },
    official: { packageName: "Peningkatan Jalan Poros Desa Cibening Lembah", supplier: "PT Lintas Bumi Karya", contractValue: 3_120_000_000, durationDays: 90 },
    offsetHari: -150,
    lokasi: "Desa Cibening Lembah",
    terbit: true,
    unggulan: true,
  },
  {
    kunci: "demo-005",
    board: { packageName: "Pembangunan Talud Sungai Cikarang Hulu Kecamatan Sukamaju", supplier: "CV Sagara Karya Utama", contractValue: 640_000_000, durationDays: 75 },
    official: { packageName: "Pembangunan Talud Sungai Cikarang Hulu Kecamatan Sukamaju", supplier: "PT Sagara Karya Teknik", contractValue: 640_000_000, durationDays: 75 },
    offsetHari: -30,
    lokasi: "Kecamatan Sukamaju",
    terbit: true,
    unggulan: false,
  },
  {
    kunci: "demo-006",
    board: { packageName: "Pembangunan Jembatan Kali Sengon Desa Tirtamulya", supplier: "PT Adhi Pratama Sejahtera", contractValue: 1_980_000_000, durationDays: 100 },
    official: { packageName: "Rehabilitasi Saluran Irigasi Sengon Desa Tirtamulya", supplier: "PT Adhi Pratama Sejahtera", contractValue: 1_980_000_000, durationDays: 100 },
    offsetHari: -60,
    lokasi: "Desa Tirtamulya",
    terbit: true,
    unggulan: false,
  },
  {
    kunci: "demo-007",
    board: { packageName: "Rehabilitasi Gedung Sekolah Dasar Negeri 3 Sumberlaras", supplier: "CV Bumi Asri Perkasa", contractValue: 1_250_000_000, durationDays: 120 },
    official: { packageName: "Rehabilitasi Gedung Sekolah Dasar Negeri 3 Sumberlaras", supplier: "PT Cahaya Utama Teknik", contractValue: 1_730_000_000, durationDays: 120 },
    offsetHari: -20,
    lokasi: "Sumberlaras",
    terbit: true,
    unggulan: false,
  },
  {
    kunci: "demo-008",
    board: { packageName: "Peningkatan Jalan Lingkungan Mawar Kecamatan Sukamaju", supplier: null, contractValue: null, durationDays: null },
    official: { packageName: "Peningkatan Jalan Lingkungan Mawar Kecamatan Sukamaju", supplier: "PT Rajawali Karya Abadi", contractValue: 780_000_000, durationDays: 60 },
    offsetHari: -15,
    lokasi: "Kecamatan Sukamaju",
    terbit: true,
    unggulan: false,
  },
  {
    kunci: "demo-009",
    board: { packageName: "Pembangunan Pagar dan Drainase Pasar Rakyat Sumberlaras", supplier: "PT Nusa Indah Konstruksi", contractValue: 2_310_000_000, durationDays: 60 },
    official: { packageName: "Pembangunan Pagar dan Drainase Pasar Rakyat Sumberlaras", supplier: "PT Nusa Indah Konstruksi", contractValue: 2_305_000_000, durationDays: 60 },
    offsetHari: -20,
    lokasi: "Sumberlaras",
    terbit: true,
    unggulan: false,
  },
  {
    kunci: "demo-010",
    board: { packageName: "Pemeliharaan Rutin Jalan Kabupaten Ruas Tirtamulya Lembah", supplier: "CV Tani Makmur Sendaya", contractValue: 450_000_000, durationDays: null },
    official: { packageName: "Pemeliharaan Rutin Jalan Kabupaten Ruas Tirtamulya Lembah", supplier: "CV Tani Makmur Sendaya", contractValue: 450_000_000, durationDays: 150 },
    offsetHari: -10,
    lokasi: "Ruas Tirtamulya Lembah",
    terbit: false, // draf sengaja untuk menguji "tidak muncul di publik" (M.2)
    unggulan: false,
  },
];

async function prosesSatu(supabase: SupabaseClient, spec: SeedSpec, hariIni: string) {
  const tanggalResmi = spec.offsetHari === null ? null : addDays(hariIni, spec.offsetHari);
  const nomorKontrak = `SIM/${spec.kunci}/${TAHUN_ANGGARAN}`;

  // Board API-shape (10 field) — papan disimpan sebagai jsonb kunci Indonesia
  // (bentuk storedBoardSchema, sama seperti rute POST /api/admin/projects).
  const boardApi = {
    packageName: spec.board.packageName,
    supplier: spec.board.supplier,
    contractValue: spec.board.contractValue,
    durationDays: spec.board.durationDays,
    fiscalYear: TAHUN_ANGGARAN,
    fundingSource: SUMBER_DANA,
    agencyUnit: INSTANSI,
    contractNumber: nomorKontrak,
    contractDate: null, // M.1: tanggal kontrak sisi papan selalu null
    locationText: spec.lokasi,
  };
  const officialApi = {
    packageName: spec.official.packageName,
    supplier: spec.official.supplier,
    contractValue: spec.official.contractValue,
    durationDays: spec.official.durationDays,
    fiscalYear: TAHUN_ANGGARAN,
    fundingSource: SUMBER_DANA,
    agencyUnit: INSTANSI,
    contractNumber: nomorKontrak,
    contractDate: tanggalResmi,
    locationText: spec.lokasi,
  };

  // Status/skor dari compare() produksi — bukan angka yang diketik manual.
  const hasil = compare(boardApi, officialApi);
  const statusInternal = statusToInternal(hasil.status);

  // 1) Upsert records pada (sumber, id_sumber) — struktur mentah sama dengan
  //    yang ditulis rute admin (T-41, recordMentah) agar officialRecordFromRow
  //    membaca seed row dengan benar.
  const recordUpsert = {
    sumber: "simulasi",
    id_sumber: spec.kunci,
    demo: true,
    nama_paket: officialApi.packageName,
    nama_norm: normalisasiTeks(officialApi.packageName),
    penyedia: officialApi.supplier,
    penyedia_norm: normalisasiTeks(officialApi.supplier),
    nilai_kontrak: officialApi.contractValue,
    satuan_kerja: INSTANSI,
    tanggal_kontrak: tanggalResmi,
    masa_hari: officialApi.durationDays,
    tahun: TAHUN_ANGGARAN,
    wilayah: spec.lokasi,
    metode: null,
    mentah: {
      fundingSource: SUMBER_DANA,
      contractNumber: nomorKontrak,
      locationText: spec.lokasi,
    },
    snapshot_tanggal: hariIni,
  };
  const { data: record, error: recordError } = await supabase
    .from("records")
    .upsert(recordUpsert, { onConflict: "sumber,id_sumber" })
    .select("id")
    .single();
  if (recordError || !record) {
    throw new Error(`${spec.kunci}: upsert records gagal: ${recordError?.message ?? "tanpa data"}`);
  }

  // 2) Cari proyek admin yang menunjuk record ini.
  const { data: existing, error: lookupError } = await supabase
    .from("submissions")
    .select("id, slug")
    .eq("jenis", "admin")
    .eq("record_id", record.id)
    .limit(1);
  if (lookupError) {
    throw new Error(`${spec.kunci}: pencarian submissions gagal: ${lookupError.message}`);
  }
  const submission = existing?.[0] ?? null;

  // Kolom yang selalu disamakan dengan tabel M.2. Slug tidak pernah ada di sini.
  const kolomProyek = {
    papan: boardToInternal(boardApi),
    status: statusInternal,
    skor: hasil.score,
    terbit: spec.terbit,
    unggulan: spec.unggulan,
    demo: true,
    dinonaktifkan: false,
  };

  if (submission) {
    const { error: updateError } = await supabase
      .from("submissions")
      .update(kolomProyek)
      .eq("id", submission.id);
    if (updateError) {
      throw new Error(`${spec.kunci}: update submissions gagal: ${updateError.message}`);
    }
    return { kunci: spec.kunci, id: submission.id, slug: submission.slug, status: hasil.status, terbit: spec.terbit, dibuat: false };
  }

  // 3) Belum ada: buat proyek admin baru dengan slug baru (sama dengan
  //    createPublicSlug() di src/lib/server-api.ts — helper itu server-only
  //    sehingga tidak bisa diimpor skrip).
  const slug = randomBytes(9).toString("base64url");
  const { data: created, error: insertError } = await supabase
    .from("submissions")
    .insert({
      slug,
      jenis: "admin",
      record_id: record.id,
      // Bentuk bundle yang sama dengan rute admin (docs/agent-notes.md no. 19):
      // dossier publik mem-parse kandidat dengan storedCandidateBundleSchema.
      kandidat: { requiresSelection: false, candidates: [] },
      ...kolomProyek,
    })
    .select("id, slug")
    .single();
  if (insertError || !created) {
    throw new Error(`${spec.kunci}: insert submissions gagal: ${insertError?.message ?? "tanpa data"}`);
  }
  return { kunci: spec.kunci, id: created.id, slug: created.slug, status: hasil.status, terbit: spec.terbit, dibuat: true };
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const kunciLayanan = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !kunciLayanan) {
    throw new Error("Seed demo menolak berjalan: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ada (muat .env, lihat M.3).");
  }
  const supabase = createClient(url, kunciLayanan, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const hariIni = jakartaToday();
  const hasil: Awaited<ReturnType<typeof prosesSatu>>[] = [];
  for (const spec of SEEDS) {
    hasil.push(await prosesSatu(supabase, spec, hariIni));
  }

  // Tabel konsol (M.3 no. 5): kunci, slug, status, terbit — slug tidak pernah
  // ditulis ke berkas yang dikomit.
  const lebar = (nilai: string, n: number) => (nilai.length > n ? nilai.slice(0, n) : nilai.padEnd(n));
  console.log(`${lebar("kunci", 9)}  ${lebar("slug", 14)}  ${lebar("status", 12)}  terbit  dibuat`);
  for (const baris of hasil) {
    console.log(
      `${lebar(baris.kunci, 9)}  ${lebar(baris.slug, 14)}  ` +
        `${lebar(baris.status, 12)}  ${lebar(baris.terbit ? "ya" : "tidak", 6)}  ${baris.dibuat ? "baru" : "update"}`,
    );
  }
  console.log(`Selesai: ${hasil.length} proyek demo pada hari seed ${hariIni}.`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
