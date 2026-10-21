// F-13 / T-13 (bagian awal): data statis untuk galeri contoh kasus.
// Semua nilai DIBUAT dan jelas rekaan (nama "PT Contoh Konstruksi", dst) sehingga
// tidak menunjuk proyek, penyedia, atau orang nyata. Setiap halaman contoh menampilkan
// label "SIMULASI, BUKAN DATA RESMI" (PRD §9.1.5). Berjalan tanpa API.
import type { ApiBoard } from "@/lib/api-contract";

export type ExampleDossier = {
  exampleId: string;
  judul: string;
  ringkasanVerifikasi: string;
  status: "cocok" | "selisih" | "tidak_ditemukan";
  board: ApiBoard;
  record: {
    id_sumber: string;
    sumber: string;
    nama_paket: string;
    penyedia: string | null;
    nilai_kontrak: number;
    tanggal_kontrak: string | null;
    masa_hari: number | null;
    tahun: number | null;
    satuan_kerja: string | null;
    snapshot_tanggal: string;
  } | null;
};

export const EXAMPLE_DOSSIERS: ExampleDossier[] = [
  {
    exampleId: "contoh-cocok",
    judul: "Papan sesuai catatan resmi",
    ringkasanVerifikasi:
      "Kasus contoh yang diperiksa manual oleh tim: isian papan sama dengan catatan resmi pada ketiga field kunci.",
    status: "cocok",
    board: {
      packageName: "Rehabilitasi Jalan Desa Contoh Sejahtera",
      supplier: "PT Contoh Konstruksi",
      contractValue: 1_250_000_000,
      durationDays: 120,
      fiscalYear: 2025,
      fundingSource: "DAK",
      agencyUnit: "Dinas PUPR (contoh)",
      contractNumber: "001/CONTIH/2025",
      contractDate: "2025-03-10",
      locationText: "Desa Contoh Sejahtera, Kec. Contoh",
    },
    record: {
      id_sumber: "contoh-ocds-0001",
      sumber: "OCDS Opentender/ICW (data simulasi)",
      nama_paket: "Rehabilitasi Jalan Desa Contoh Sejahtera",
      penyedia: "PT Contoh Konstruksi",
      nilai_kontrak: 1_250_000_000,
      tanggal_kontrak: "2025-03-10",
      masa_hari: 120,
      tahun: 2025,
      satuan_kerja: "Dinas PUPR (contoh)",
      snapshot_tanggal: "2026-09-30",
    },
  },
  {
    exampleId: "contoh-selisih",
    judul: "Papan berbeda dari catatan resmi",
    ringkasanVerifikasi:
      "Kasus contoh yang diperiksa manual oleh tim: nilai kontrak di papan berbeda dari catatan; perbedaan sering wajar karena addendum.",
    status: "selisih",
    board: {
      packageName: "Pembangunan Drainase Lingkungan Contoh Makmur",
      supplier: "CV Contoh Mitra Bangun",
      contractValue: 780_000_000,
      durationDays: 90,
      fiscalYear: 2024,
      fundingSource: "DAU",
      agencyUnit: "Dinas PUPR (contoh)",
      contractNumber: "002/CONTIH/2024",
      contractDate: "2024-06-01",
      locationText: "Kel. Contoh Makmur",
    },
    record: {
      id_sumber: "contoh-ocds-0002",
      sumber: "OCDS Opentender/ICW (data simulasi)",
      nama_paket: "Pembangunan Drainase Lingkungan Contoh Makmur",
      penyedia: "CV Contoh Mitra Bangun",
      nilai_kontrak: 897_000_000,
      tanggal_kontrak: "2024-06-01",
      masa_hari: 90,
      tahun: 2024,
      satuan_kerja: "Dinas PUPR (contoh)",
      snapshot_tanggal: "2026-09-30",
    },
  },
  {
    exampleId: "contoh-tidak-ditemukan",
    judul: "Papan belum ada di catatan kami",
    ringkasanVerifikasi:
      "Kasus contoh yang diperiksa manual oleh tim: paket di papan tidak ditemukan pada snapshot data resmi yang kami miliki.",
    status: "tidak_ditemukan",
    board: {
      packageName: "Penyempurnaan Gedung Pasar Contoh Sentosa",
      supplier: "PT Contoh Adi Persada",
      contractValue: 3_400_000_000,
      durationDays: 240,
      fiscalYear: 2026,
      fundingSource: "BLUD",
      agencyUnit: "Dinas Pasar (contoh)",
      contractNumber: "003/CONTIH/2026",
      contractDate: "2026-01-20",
      locationText: "Kota Contoh",
    },
    record: null,
  },
];

export function ambilContoh(exampleId: string): ExampleDossier | null {
  return EXAMPLE_DOSSIERS.find((d) => d.exampleId === exampleId) ?? null;
}
