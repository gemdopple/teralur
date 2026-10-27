import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import { readJsonBody, databaseConfigured } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";
import { z } from "zod";

// Moderasi laporan warga (anti-massa): sembunyikan/tampilkan satu laporan.
// Baris TIDAK dihapus — jejak audit tetap; hitungan publik (RPC
// visit_report_counts) hanya menghitung baris dengan tampil = true.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const tubuhSchema = z.object({ tampil: z.boolean() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(); // paling awal, sebelum membaca parameter/body (E.1)
    if (!databaseConfigured()) {
      return jsonError("INTERNAL", 500, "Basis data belum dikonfigurasi.");
    }
    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return jsonError("VALIDATION_ERROR", 422, "Parameter id wajib berupa id laporan yang valid.");
    }
    const body = await readJsonBody(request);
    if (!body.valid) {
      return jsonError("VALIDATION_ERROR", 422, "Isi permintaan tidak valid.");
    }
    const parsed = tubuhSchema.safeParse(body.value);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", 422, "Kirim { tampil: boolean }.");
    }

    const { data: updated, error } = await getSupabaseAdmin()
      .from("kunjungan")
      .update({ tampil: parsed.data.tampil })
      .eq("id", id)
      .select("id, tampil")
      .maybeSingle();
    if (error) {
      console.error("Unable to update visit report visibility:", error.message);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }
    if (!updated) {
      return jsonError("NOT_FOUND", 404, "Laporan tidak ditemukan.");
    }
    return jsonOk({ id: updated.id, tampil: updated.tampil });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
