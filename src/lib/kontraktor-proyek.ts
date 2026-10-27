import "server-only";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";
import { parseStoredBoard } from "@/lib/admin-projects";
import type { DossierStatus } from "@/components/teralur/ChipStatus";

// Proyek yang ditugaskan ke SATU kontraktor — sumber tunggal untuk penyaringan
// "kontraktor hanya melihat proyeknya sendiri". Query di sini WAJIB menyaring
// dengan contractor_id; tidak ada parameter yang dapat memperlebarnya, sehingga
// kontraktor tidak bisa melihat penugasan kontraktor lain walau menebak id.

export type ProyekKontraktor = {
  id: string;
  slug: string;
  title: string;
  /** Status internal (cocok/selisih/tidak_ditemukan/…) untuk ChipStatus. */
  status: DossierStatus;
  contractorId: string | null;
  updatedAt: string;
  /** Tautan papan (hanya bermakna untuk proyek yang ditugaskan). */
  papanHref: string;
  /** Tautan dossier publik proyek. */
  dossierHref: string;
};

type Baris = {
  id: string;
  slug: string;
  status: string | null;
  contractor_id: string | null;
  diperbarui: string;
  papan: unknown;
  records: { nama_paket: string } | { nama_paket: string }[] | null;
};

// Kolom submissions.status menyimpan nilai internal; ChipStatus memakai nilai
// yang sama (api-contract memetakan ke enum API hanya di batas HTTP).
const STATUS_CHIP: Record<string, DossierStatus> = {
  cocok: "cocok",
  selisih: "selisih",
  tidak_ditemukan: "tidak_ditemukan",
  catatan_resmi: "catatan_resmi",
};

export function barisKeProyekKontraktor(row: Baris): ProyekKontraktor {
  const papan = parseStoredBoard(row.papan);
  const record = Array.isArray(row.records) ? row.records[0] : row.records;
  return {
    id: row.id,
    slug: row.slug,
    title: papan?.packageName ?? record?.nama_paket ?? "(tanpa judul)",
    status: STATUS_CHIP[row.status ?? ""] ?? "tidak_ditemukan",
    contractorId: row.contractor_id,
    updatedAt: row.diperbarui,
    // Papan memakai id proyek (UUID) sebagai kunci segmen.
    papanHref: `/dashboard/proyek/${row.id}/papan`,
    dossierHref: `/dossiers/${row.slug}`,
  };
}

/**
 * Daftar proyek milik kontraktor tertentu. Mengembalikan daftar KOSONG bila
 * contractorId null (kontraktor tanpa tautan) — tidak pernah seluruh proyek.
 */
export async function proyekUntukKontraktor(contractorId: string | null): Promise<ProyekKontraktor[]> {
  if (!contractorId || !databaseConfigured()) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .select("id, slug, status, contractor_id, diperbarui, papan, records!record_id(nama_paket)")
    .eq("jenis", "admin")
    .eq("dinonaktifkan", false)
    .eq("contractor_id", contractorId)
    .order("diperbarui", { ascending: false });
  if (error) throw new Error(`Contractor project list failed: ${error.message}`);
  return ((data ?? []) as Baris[]).map(barisKeProyekKontraktor);
}

/** Satu proyek milik kontraktor; null bila bukan miliknya (atau tidak ada). */
export async function proyekKontraktor(
  contractorId: string | null,
  projectId: string,
): Promise<ProyekKontraktor | null> {
  if (!contractorId || !databaseConfigured()) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .select("id, slug, status, contractor_id, diperbarui, papan, records!record_id(nama_paket)")
    .eq("id", projectId)
    .eq("jenis", "admin")
    .eq("dinonaktifkan", false)
    .eq("contractor_id", contractorId)
    .maybeSingle();
  if (error) throw new Error(`Contractor project lookup failed: ${error.message}`);
  return data ? barisKeProyekKontraktor(data as Baris) : null;
}