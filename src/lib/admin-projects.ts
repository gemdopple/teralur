import "server-only";
import { z } from "zod";
import {
  boardToApi,
  statusToApi,
  storedBoardSchema,
  type ApiBoard,
  type ApiMatchStatus,
} from "@/lib/api-contract";
import { getSupabaseAdmin } from "@/lib/db";
import type { Status } from "@/lib/match/types";

// Helper bersama untuk rute /api/admin/projects (T-41, Lampiran E.2–E.7).
// Semua rute tetap memanggil requireAdmin() paling awal di file rute masing-masing.

export function zodDetails(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.filter(
      (part): part is string | number => typeof part === "string" || typeof part === "number",
    ),
    message: issue.message,
  }));
}

export function firstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Payload tidak valid.";
}

export function isJsonRequest(request: Request): boolean {
  return (request.headers.get("content-type") ?? "").includes("application/json");
}

// Status tersimpan di submissions memakai nilai internal (catatan no. 6
// docs/agent-notes.md); pemetaan ke enum API tetap lewat api-contract.
export function storedStatusToApi(status: string | null): ApiMatchStatus {
  const internal: Status =
    status === "cocok" || status === "selisih" || status === "tidak_ditemukan"
      ? status
      : "tidak_ditemukan";
  return statusToApi(internal);
}

export function parseStoredBoard(papan: unknown): ApiBoard | null {
  const hasil = storedBoardSchema.safeParse(papan);
  return hasil.success ? boardToApi(hasil.data) : null;
}

export type ProjectRecordRow = {
  id: string;
  nama_paket: string;
  penyedia: string | null;
  nilai_kontrak: number | string;
  tanggal_kontrak: string | null;
  masa_hari: number | null;
  tahun: number | null;
  satuan_kerja: string | null;
  wilayah: string | null;
  mentah: Record<string, unknown> | null;
};

// officialRecord dibaca kembali dalam bentuk API (10 field, null dipertahankan).
// fundingSource/contractNumber/locationText disimpan di kolom mentah (C.3).
export function officialRecordFromRow(row: ProjectRecordRow): ApiBoard {
  const mentah = row.mentah ?? {};
  return {
    packageName: row.nama_paket,
    supplier: row.penyedia,
    contractValue: Number(row.nilai_kontrak),
    durationDays: row.masa_hari,
    fiscalYear: row.tahun,
    fundingSource: typeof mentah.fundingSource === "string" ? mentah.fundingSource : null,
    agencyUnit: row.satuan_kerja,
    contractNumber: typeof mentah.contractNumber === "string" ? mentah.contractNumber : null,
    contractDate: row.tanggal_kontrak,
    locationText: typeof mentah.locationText === "string" ? mentah.locationText : null,
  };
}

export function recordMentah(record: ApiBoard): Record<string, unknown> {
  return {
    fundingSource: record.fundingSource,
    contractNumber: record.contractNumber,
    locationText: record.locationText,
  };
}

export async function countUnggulanAktif(excludeId?: string): Promise<number> {
  let query = getSupabaseAdmin()
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("unggulan", true)
    .eq("dinonaktifkan", false);
  if (excludeId) query = query.neq("id", excludeId);
  const { count, error } = await query;
  if (error) throw new Error(`Featured count failed: ${error.message}`);
  return count ?? 0;
}
