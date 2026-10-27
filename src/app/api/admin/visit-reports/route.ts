import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import { databaseConfigured } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";

// Daftar laporan kunjungan untuk tim admin (PRD v1.1 Lampiran E.13, T-47).
// `projectId` = id baris `submissions` proyek admin; kunci yang dicari di
// `kunjungan.kunci_proyek` adalah id baris `records` proyek (kunci proyek v1.0,
// sama dengan resolusi di src/app/api/visit-reports/route.ts: record_id ?? id).
// Catatan (catatan lapangan) hanya untuk admin dan TIDAK PERNAH ada di respons
// publik (invarian privasi F-14).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// keadaan tersimpan (internal) -> enum API E.13.
const KEADAAN_TO_API = {
  aktivitas: "active",
  tidak_terlihat: "no_activity_seen",
  selesai: "appears_complete",
} as const;

export async function GET(request: Request) {
  try {
    await requireAdmin(); // paling awal, sebelum membaca parameter/body (E.1)
    if (!databaseConfigured()) {
      return jsonError("INTERNAL", 500, "Basis data belum dikonfigurasi.");
    }

    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId || !UUID_RE.test(projectId)) {
      return jsonError("VALIDATION_ERROR", 422, "Parameter projectId wajib berupa id proyek yang valid.");
    }

    // Proyek admin disimpan sebagai baris submissions; laporan kunjungan
    // diatribusikan ke records.id-nya (kecuali proyek tanpa record).
    const { data: submission, error: lookupError } = await getSupabaseAdmin()
      .from("submissions")
      .select("id, record_id")
      .eq("id", projectId)
      .eq("jenis", "admin")
      .maybeSingle();
    if (lookupError) {
      console.error("Unable to look up admin project for visit reports:", lookupError.message);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }
    if (!submission) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }

    const projectKey = submission.record_id ?? submission.id;
    const { data: rows, error: reportsError } = await getSupabaseAdmin()
      .from("kunjungan")
      .select("id, keadaan, catatan, tanggal, tampil")
      .eq("kunci_proyek", projectKey)
      .order("tanggal", { ascending: false })
      .order("id", { ascending: false });
    if (reportsError) {
      console.error("Unable to list visit reports:", reportsError.message);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }

    return jsonOk({
      reports: (rows ?? []).flatMap((row) => {
        const activityStatus = KEADAAN_TO_API[row.keadaan as keyof typeof KEADAAN_TO_API];
        if (!activityStatus) return []; // keadaan tak dikenal: lewati, jangan 500
        return [
          {
            id: row.id,
            activityStatus,
            note: row.catatan, // verbatim, hanya untuk tim (F-14)
            date: row.tanggal,
            tampil: row.tampil,
          },
        ];
      }),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
