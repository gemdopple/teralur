import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db";
import { normalisasiTeks } from "@/lib/match/normalisasi";
import type { ApiBoard } from "@/lib/api-contract";

export type RecordRow = {
  id: string;
  id_sumber: string;
  sumber: string;
  nama_paket: string;
  penyedia: string | null;
  nilai_kontrak: number | string;
  tanggal_kontrak: string | null;
  masa_hari: number | null;
  tahun: number | null;
  satuan_kerja: string | null;
  snapshot_tanggal: string;
  // E.12: hanya diisi oleh search_records; baris kandidat (find_record_candidates)
  // tidak mengembalikan kedua kolom ini.
  demo?: boolean;
  slug?: string | null;
};

export type SubmissionRow = {
  id: string;
  slug: string;
  jenis: "foto" | "cari" | "admin";
  papan: Record<string, unknown> | null;
  record_id: string | null;
  status: string | null;
  kandidat: unknown;
  dibuat: string;
  demo: boolean;
  // E.11: visibilitas proyek admin (nonaktif = 404 di jalur publik).
  dinonaktifkan: boolean;
  unggulan: boolean;
  diperbarui: string;
};

export type ResourceRow = {
  id: string;
  jenis: "photo" | "document";
  judul: string;
  path_penyimpanan: string;
  dibuat: string;
};

export const storedCandidateBundleSchema = z.object({
  requiresSelection: z.boolean(),
  candidates: z.array(
    z.object({
      recordId: z.string().uuid(),
      score: z.number(),
      passed: z.object({
        penyedia: z.boolean(),
        nama: z.boolean(),
        nilai: z.boolean(),
      }),
      discrepancies: z.array(z.string()),
    }),
  ),
});

export type DossierCandidate = z.infer<typeof storedCandidateBundleSchema>["candidates"][number] & {
  record: RecordRow;
};

export type DossierData = {
  submission: SubmissionRow;
  record: RecordRow | null;
  candidates: DossierCandidate[];
  requiresSelection: boolean;
  visitCounts: { active: number; no_activity_seen: number; appears_complete: number };
  resources: ResourceRow[];
};

export function databaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function readJsonBody(
  request: Request,
): Promise<{ valid: true; value: unknown } | { valid: false }> {
  try {
    return { valid: true, value: await request.json() };
  } catch (error) {
    if (error instanceof SyntaxError) return { valid: false };
    throw error;
  }
}

export function ipRateKey(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error("IP_HASH_SALT is not configured");
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function deviceRateKey(deviceId: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error("IP_HASH_SALT is not configured");
  return createHash("sha256").update(`${salt}:device:${deviceId}`).digest("hex");
}

export async function requestIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip");
  if (!ip) throw new Error("Client IP is unavailable");
  return ip;
}

export function currentHourWindow(): string {
  const date = new Date();
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

export async function consumeRateLimit(key: string, limit: number): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin().rpc("consume_rate_limit", {
    p_ip_hash: key,
    p_window: currentHourWindow(),
    p_limit: limit,
  });
  if (error) throw new Error(`Rate-limit check failed: ${error.message}`);
  return data === true;
}

export function createPublicSlug(): string {
  return randomBytes(9).toString("base64url");
}

export async function searchRecords(query: string, year: number | null): Promise<RecordRow[]> {
  const { data, error } = await getSupabaseAdmin().rpc("search_records", {
    search_text: normalisasiTeks(query),
    filter_year: year,
    result_limit: 10,
  });
  if (error) throw new Error(`Record search failed: ${error.message}`);
  return (data ?? []) as RecordRow[];
}

export async function findRecordCandidates(board: ApiBoard): Promise<RecordRow[]> {
  const { data, error } = await getSupabaseAdmin().rpc("find_record_candidates", {
    package_name: normalisasiTeks(board.packageName ?? ""),
    supplier_name: normalisasiTeks(board.supplier ?? ""),
    year_filter: board.fiscalYear,
  });
  if (error) throw new Error(`Candidate lookup failed: ${error.message}`);
  return (data ?? []) as RecordRow[];
}

export async function getDossier(slug: string): Promise<DossierData | null> {
  const supabase = getSupabaseAdmin();
  // Satu round trip (H.1): submission + resource ter-embed, resource urut dibuat asc.
  const { data: submission, error } = await supabase
    .from("submissions")
    .select("*, resources(id, jenis, judul, path_penyimpanan, dibuat)")
    .eq("slug", slug)
    .order("dibuat", { referencedTable: "resources", ascending: true })
    .maybeSingle();
  if (error) throw new Error(`Dossier lookup failed: ${error.message}`);
  if (!submission) return null;
  // E.11: proyek yang dinonaktifkan (hapus lunak) tidak pernah terlihat publik.
  if (submission.dinonaktifkan) return null;
  const resourceRows = (Array.isArray(submission.resources) ? submission.resources : []) as ResourceRow[];
  delete (submission as Record<string, unknown>).resources;

  let record: RecordRow | null = null;
  if (submission.record_id) {
    const { data, error: recordError } = await supabase
      .from("records")
      .select("id,id_sumber,sumber,nama_paket,penyedia,nilai_kontrak,tanggal_kontrak,masa_hari,tahun,satuan_kerja,snapshot_tanggal")
      .eq("id", submission.record_id)
      .maybeSingle();
    if (recordError) throw new Error(`Official record lookup failed: ${recordError.message}`);
    record = data as RecordRow | null;
  }

  const storedCandidates = storedCandidateBundleSchema.safeParse(submission.kandidat);
  if (!storedCandidates.success) {
    throw new Error(`Stored candidate data is invalid for dossier ${slug}`);
  }
  const candidateIds = storedCandidates.data.candidates.map((candidate) => candidate.recordId);
  let candidateRows: RecordRow[] = [];
  if (candidateIds.length > 0) {
    const { data, error: candidatesError } = await supabase
      .from("records")
      .select("id,id_sumber,sumber,nama_paket,penyedia,nilai_kontrak,tanggal_kontrak,masa_hari,tahun,satuan_kerja,snapshot_tanggal")
      .in("id", candidateIds);
    if (candidatesError) throw new Error(`Candidate record lookup failed: ${candidatesError.message}`);
    candidateRows = (data ?? []) as RecordRow[];
  }
  const candidateMap = new Map(candidateRows.map((row) => [row.id, row]));
  const candidates = storedCandidates.data.candidates.flatMap((candidate) => {
    const candidateRecord = candidateMap.get(candidate.recordId);
    return candidateRecord ? [{ ...candidate, record: candidateRecord }] : [];
  });

  const projectKey = record?.id ?? submission.id;
  const { data: reports, error: reportsError } = await supabase.rpc("visit_report_counts", {
    p_project_key: projectKey,
  });
  if (reportsError) throw new Error(`Visit report lookup failed: ${reportsError.message}`);

  const visitCounts = { active: 0, no_activity_seen: 0, appears_complete: 0 };
  for (const report of reports ?? []) {
    if (report.keadaan === "aktivitas") visitCounts.active = Number(report.jumlah);
    if (report.keadaan === "tidak_terlihat") visitCounts.no_activity_seen = Number(report.jumlah);
    if (report.keadaan === "selesai") visitCounts.appears_complete = Number(report.jumlah);
  }

  return {
    submission: submission as SubmissionRow,
    record,
    candidates,
    requiresSelection: storedCandidates.data.requiresSelection,
    visitCounts,
    resources: resourceRows,
  };
}

export function recordToApi(row: RecordRow) {
  return {
    id: row.id,
    sourceId: row.id_sumber,
    source: row.sumber,
    packageName: row.nama_paket,
    supplier: row.penyedia,
    contractValue: Number(row.nilai_kontrak),
    contractDate: row.tanggal_kontrak,
    durationDays: row.masa_hari,
    fiscalYear: row.tahun,
    agencyUnit: row.satuan_kerja,
    snapshotDate: row.snapshot_tanggal,
  };
}
