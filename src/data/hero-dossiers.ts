// Salinan statis tiga proyek hero (T-28 mode cadangan, F-13, N.2 butir 11):
// demo-001 (Cocok, cincin berjalan), demo-002 (Selisih nilai), demo-004
// (Cocok, melewati masa kontrak). Data identik dengan seed M.2
// (scripts/seed-demo.ts) — nama rekaan tercatat di docs/demo-names.md.
// Tanggal kontrak resmi dihitung dari offset hari yang sama dengan seed
// (M.3 no. 6) sehingga keadaan cincin tetap sama pada hari mana pun salinan
// dibuka. Status TIDAK diketik manual: dihitung compare() produksi saat
// halaman dirender. Tanpa panggilan basis data — berjalan tanpa API.

import { addDays } from "../lib/dates";
import { computeTimeRing, type TimeRing } from "../lib/cincin";
import { compare } from "../lib/compare";
import { statusToInternal, type ApiBoard } from "../lib/api-contract";
import type { DossierStatus } from "@/components/teralur/ChipStatus";
import type { RecordProyek } from "@/components/teralur/proyek-view-data";
import type { SelisihProyek } from "@/components/teralur/TabelPapanCatatan";

// M.1: kolom yang tidak tercantum pada tabel M.2 (sama dengan seed).
const TAHUN_ANGGARAN = 2026;
const SUMBER_DANA = "APBD 2026";
const INSTANSI = "Dinas Pekerjaan Umum Kota Tirtamulya";

export type HeroSpec = {
  /** Kunci seed yang sama (demo-001 dst.) — dipakai sebagai exampleId URL. */
  exampleId: string;
  /** Offset hari mulai kontrak resmi dari hari render; null = tanpa tanggal. */
  offsetHari: number | null;
  lokasi: string;
  board: {
    packageName: string | null;
    supplier: string | null;
    contractValue: number | null;
    durationDays: number | null;
  };
  official: {
    packageName: string;
    supplier: string;
    contractValue: number;
    durationDays: number | null;
  };
};

// Tiga hero unggulan M.2 (demo-001, demo-002, demo-004) — salinan persis
// dari SEEDS scripts/seed-demo.ts; bila seed berubah, berkas ini ikut.
export const HERO_SPECS: HeroSpec[] = [
  {
    exampleId: "demo-001",
    board: { packageName: "Rehabilitasi Jalan Lingkungan Melati Raya Kecamatan Sukamaju", supplier: "PT Karya Bangun Nusantara Jaya", contractValue: 1_485_000_000, durationDays: 90 },
    official: { packageName: "Rehabilitasi Jalan Lingkungan Melati Raya Kecamatan Sukamaju", supplier: "PT KARYA BANGUN NUSANTARA JAYA", contractValue: 1_485_000_000, durationDays: 90 },
    offsetHari: -74,
    lokasi: "Kecamatan Sukamaju",
  },
  {
    exampleId: "demo-002",
    board: { packageName: "Pembangunan Drainase Primer Jalan Kenanga Desa Tirtamulya", supplier: "CV Sinar Tirta Konstruksi", contractValue: 875_000_000, durationDays: 120 },
    official: { packageName: "Pembangunan Drainase Primer Jalan Kenanga Desa Tirtamulya", supplier: "CV Sinar Tirta Konstruksi", contractValue: 912_500_000, durationDays: 120 },
    offsetHari: -45,
    lokasi: "Desa Tirtamulya",
  },
  {
    exampleId: "demo-004",
    board: { packageName: "Peningkatan Jalan Poros Desa Cibening Lembah", supplier: "PT Lintas Bumi Karya", contractValue: 3_120_000_000, durationDays: 90 },
    official: { packageName: "Peningkatan Jalan Poros Desa Cibening Lembah", supplier: "PT Lintas Bumi Karya", contractValue: 3_120_000_000, durationDays: 90 },
    offsetHari: -150,
    lokasi: "Desa Cibening Lembah",
  },
];

const LABEL_FIELD_SELISIH: Record<SelisihProyek["field"], string> = {
  packageName: "Nama paket",
  supplier: "Penyedia",
  contractValue: "Nilai kontrak",
};

export type HeroDossier = {
  exampleId: string;
  status: DossierStatus;
  packageName: string;
  board: ApiBoard;
  record: RecordProyek;
  discrepancies: SelisihProyek[];
  timeRing: TimeRing;
};

/** Murni: tanggal hari ini (TTTT-BB-HH WIB) masuk sebagai argumen. */
export function heroDossier(spec: HeroSpec, today: string): HeroDossier {
  const tanggalResmi = spec.offsetHari === null ? null : addDays(today, spec.offsetHari);
  const nomorKontrak = `SIM/${spec.exampleId}/${TAHUN_ANGGARAN}`;
  // M.1: tanggal kontrak sisi papan selalu null; kolom lain memakai baku seed.
  const board: ApiBoard = {
    packageName: spec.board.packageName,
    supplier: spec.board.supplier,
    contractValue: spec.board.contractValue,
    durationDays: spec.board.durationDays,
    fiscalYear: TAHUN_ANGGARAN,
    fundingSource: SUMBER_DANA,
    agencyUnit: INSTANSI,
    contractNumber: nomorKontrak,
    contractDate: null,
    locationText: spec.lokasi,
  };
  const official: ApiBoard = {
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

  const hasil = compare(board, official);
  const discrepancies: SelisihProyek[] = hasil.discrepancies.map((komponen) => ({
    field: komponen.field,
    fieldLabel: LABEL_FIELD_SELISIH[komponen.field],
    boardValue: String(komponen.boardValue),
    recordValue: String(komponen.recordValue),
  }));

  return {
    exampleId: spec.exampleId,
    status: statusToInternal(hasil.status),
    packageName: board.packageName ?? official.packageName ?? "Nama paket belum diketahui",
    board,
    record: {
      sourceId: spec.exampleId,
      packageName: official.packageName ?? "Nama paket belum diketahui",
      supplier: official.supplier,
      contractValue: official.contractValue,
      contractDate: official.contractDate,
      durationDays: official.durationDays,
      fiscalYear: official.fiscalYear,
      agencyUnit: official.agencyUnit,
      snapshotDate: today,
    },
    discrepancies,
    timeRing: computeTimeRing({
      boardDurationDays: board.durationDays,
      recordDurationDays: official.durationDays,
      boardContractDate: board.contractDate,
      recordContractDate: official.contractDate,
      today,
    }),
  };
}
