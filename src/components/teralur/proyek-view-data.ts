// Data tampilan untuk halaman dossier dan kartu bukti proyek admin (T-45/T-25,
// Lampiran H). Pemetaan ini MENIRU GET /api/dossiers/[slug] (E.11): board dari
// papan tersimpan, timeRing dari computeTimeRing (G.1) dengan hari ini WIB,
// discrepancies dari compare() untuk proyek admin, URL resource publik Storage.
// Halaman memanggil getDossier langsung di server (H.1: satu pemanggilan data,
// bukan lewat HTTP) — pemetaan diduplikasi dari route API karena route di luar
// lingkup berkas FE (dicatat di docs/agent-notes.md).

import { cache } from "react";
import { boardToApi, storedBoardSchema, type ApiBoard } from "@/lib/api-contract";
import { computeTimeRing, type TimeRing } from "@/lib/cincin";
import { compare } from "@/lib/compare";
import { jakartaToday } from "@/lib/dates";
import { databaseConfigured, getDossier } from "@/lib/server-api";
import type { DossierStatus } from "@/components/teralur/ChipStatus";
import type { ResourcePublik } from "@/components/teralur/DaftarResource";
import type { SelisihProyek } from "@/components/teralur/TabelPapanCatatan";

const INTERNAL_STATUSES: Record<string, DossierStatus | undefined> = {
  cocok: "cocok",
  selisih: "selisih",
  tidak_ditemukan: "tidak_ditemukan",
  catatan_resmi: "catatan_resmi",
};

export type RecordProyek = {
  sourceId: string;
  packageName: string;
  supplier: string | null;
  contractValue: number | null;
  contractDate: string | null;
  durationDays: number | null;
  fiscalYear: number | null;
  agencyUnit: string | null;
  snapshotDate: string;
};

export type ProyekViewData = {
  slug: string;
  jenis: "foto" | "cari" | "admin";
  status: DossierStatus;
  demo: boolean;
  featured: boolean;
  packageName: string;
  board: ApiBoard | null;
  record: RecordProyek | null;
  discrepancies: SelisihProyek[];
  timeRing: TimeRing;
  resources: ResourcePublik[];
  visitCounts: { active: number; no_activity_seen: number; appears_complete: number };
};

const LABEL_FIELD_SELISIH: Record<SelisihProyek["field"], string> = {
  packageName: "Nama paket",
  supplier: "Penyedia",
  contractValue: "Nilai kontrak",
};

// Satu pemanggilan getDossier per request (H.1): dibungkus React cache() agar
// generateMetadata dan halaman (atau jalur v1.0) berbagi hasil yang sama.
export const getDossierCached = cache(getDossier);

export async function getProyekViewData(slug: string): Promise<ProyekViewData | null> {
  if (!databaseConfigured()) return null;
  const data = await getDossierCached(slug);
  if (!data) return null;

  const { submission, record, visitCounts, resources } = data;
  const status = INTERNAL_STATUSES[submission.status ?? ""];
  const boardResult =
    submission.papan === null ? null : storedBoardSchema.safeParse(submission.papan);
  if (!status || (boardResult !== null && !boardResult.success)) {
    throw new Error("Dossier tersimpan dengan data yang tidak valid.");
  }
  const board = boardResult?.success ? boardToApi(boardResult.data) : null;

  // Cincin waktu (G.1) dihitung server dengan hari ini WIB — sama dengan E.11.
  const timeRing = computeTimeRing({
    boardDurationDays: board?.durationDays ?? null,
    recordDurationDays: record?.masa_hari ?? null,
    boardContractDate: board?.executionStartDate ?? board?.contractDate ?? null,
    recordContractDate: record?.tanggal_kontrak ?? null,
    today: jakartaToday(),
  });

  // Selisih (E.11): hanya untuk proyek admin, komponen kunci yang tidak lulus.
  let discrepancies: SelisihProyek[] = [];
  if (submission.jenis === "admin" && board && record) {
    discrepancies = compare(board, {
      packageName: record.nama_paket,
      supplier: record.penyedia,
      contractValue: Number(record.nilai_kontrak),
    }).discrepancies.map((component) => ({
      field: component.field,
      fieldLabel: LABEL_FIELD_SELISIH[component.field],
      boardValue: String(component.boardValue),
      recordValue: String(component.recordValue),
    }));
  }

  const basis = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";

  return {
    slug: submission.slug,
    jenis: submission.jenis,
    status,
    demo: submission.demo,
    featured: submission.unggulan,
    packageName: record?.nama_paket ?? board?.packageName ?? "Nama paket belum diketahui",
    board,
    record: record
      ? {
          sourceId: record.id_sumber,
          packageName: record.nama_paket,
          supplier: record.penyedia,
          contractValue: Number(record.nilai_kontrak),
          contractDate: record.tanggal_kontrak,
          durationDays: record.masa_hari,
          fiscalYear: record.tahun,
          agencyUnit: record.satuan_kerja,
          snapshotDate: record.snapshot_tanggal,
        }
      : null,
    discrepancies,
    timeRing,
    resources: resources.map((row) => ({
      id: row.id,
      kind: row.jenis,
      title: row.judul,
      url: `${basis}/storage/v1/object/public/resources/${row.path_penyimpanan}`,
      createdAt: row.dibuat,
    })),
    visitCounts,
  };
}
