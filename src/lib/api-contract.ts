import { z } from "zod";
import type { Papan, Status } from "@/lib/match/types";

export const boardSchema = z.object({
  packageName: z.string().nullable(),
  supplier: z.string().nullable(),
  contractValue: z
    .number()
    .finite()
    .int()
    .nonnegative()
    .refine(Number.isSafeInteger, "Must be a safe integer")
    .nullable(),
  durationDays: z.number().int().positive().nullable(),
  fiscalYear: z.number().int().nullable(),
  fundingSource: z.string().nullable(),
  agencyUnit: z.string().nullable(),
  contractNumber: z.string().nullable(),
  contractDate: z.string().date().nullable(),
  locationText: z.string().nullable(),
  executionStartDate: z.string().date().nullable().optional(),
  executionEndDate: z.string().date().nullable().optional(),
  locationLatitude: z.number().finite().min(-90).max(90).nullable().optional(),
  locationLongitude: z.number().finite().min(-180).max(180).nullable().optional(),
});

export type ApiBoard = z.infer<typeof boardSchema>;

export const storedBoardSchema = z.object({
  nama_paket: z.string().nullable(),
  penyedia: z.string().nullable(),
  nilai_kontrak: z.number().finite().nonnegative().nullable(),
  masa_hari: z.number().int().positive().nullable(),
  tahun_anggaran: z.number().int().nullable(),
  sumber_dana: z.string().nullable(),
  satuan_kerja: z.string().nullable(),
  nomor_kontrak: z.string().nullable(),
  tanggal_kontrak: z.string().date().nullable(),
  lokasi_teks: z.string().nullable(),
  masa_mulai: z.string().date().nullable().optional(),
  masa_selesai: z.string().date().nullable().optional(),
  lokasi_lat: z.number().finite().min(-90).max(90).nullable().optional(),
  lokasi_lng: z.number().finite().min(-180).max(180).nullable().optional(),
});

export const matchRequestSchema = z.object({ board: boardSchema });
// Bukti kerja anti-massa: klien mengembalikan tantangan yang diterbitkan
// server beserta nonce hasil pemecahan (lihat src/lib/pow*.ts).
export const buktiPoWSchema = z.object({
  tantangan: z.string(),
  nonce: z.string().regex(/^[0-9a-f]{1,16}$/),
});
export const visitReportRequestSchema = z.object({
  dossierSlug: z.string().regex(/^[A-Za-z0-9_-]{12}$/),
  activityStatus: z.enum(["active", "no_activity_seen", "appears_complete"]),
  note: z.string().max(200).optional(),
  bukti: buktiPoWSchema,
  // Honeypot: kolom tersembunyi untuk bot — harus kosong/tidak dikirim.
  website: z.string().max(200).optional(),
});

export type ApiMatchStatus = "matched" | "discrepancy" | "not_found";
export type ApiStatus = ApiMatchStatus | "official_record";
export type ApiActivityStatus = z.infer<typeof visitReportRequestSchema>["activityStatus"];

const STATUS_TO_API: Record<Status, ApiMatchStatus> = {
  cocok: "matched",
  selisih: "discrepancy",
  tidak_ditemukan: "not_found",
};

const API_TO_STATUS: Record<ApiMatchStatus, Status> = {
  matched: "cocok",
  discrepancy: "selisih",
  not_found: "tidak_ditemukan",
};

export function boardToInternal(board: ApiBoard): Papan {
  return {
    nama_paket: board.packageName,
    penyedia: board.supplier,
    nilai_kontrak: board.contractValue,
    masa_hari: board.durationDays,
    tahun_anggaran: board.fiscalYear,
    sumber_dana: board.fundingSource,
    satuan_kerja: board.agencyUnit,
    nomor_kontrak: board.contractNumber,
    tanggal_kontrak: board.contractDate,
    lokasi_teks: board.locationText,
    masa_mulai: board.executionStartDate ?? null,
    masa_selesai: board.executionEndDate ?? null,
    lokasi_lat: board.locationLatitude ?? null,
    lokasi_lng: board.locationLongitude ?? null,
  };
}

export function boardToApi(board: Papan): ApiBoard {
  return {
    packageName: board.nama_paket,
    supplier: board.penyedia,
    contractValue: board.nilai_kontrak,
    durationDays: board.masa_hari,
    fiscalYear: board.tahun_anggaran,
    fundingSource: board.sumber_dana,
    agencyUnit: board.satuan_kerja,
    contractNumber: board.nomor_kontrak,
    contractDate: board.tanggal_kontrak,
    locationText: board.lokasi_teks,
    executionStartDate: board.masa_mulai ?? null,
    executionEndDate: board.masa_selesai ?? null,
    locationLatitude: board.lokasi_lat ?? null,
    locationLongitude: board.lokasi_lng ?? null,
  };
}

export function statusToApi(status: Status): ApiMatchStatus {
  return STATUS_TO_API[status];
}

export function dossierStatusToApi(status: Status | "catatan_resmi"): ApiStatus {
  return status === "catatan_resmi" ? "official_record" : STATUS_TO_API[status];
}

export function statusToInternal(status: ApiMatchStatus): Status {
  return API_TO_STATUS[status];
}

export function discrepancyFieldToApi(field: string): string {
  const names: Record<string, string> = {
    penyedia: "supplier",
    nama_paket: "packageName",
    nilai_kontrak: "contractValue",
  };
  return names[field] ?? field;
}
