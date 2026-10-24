import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import { getSupabaseAdmin } from "@/lib/db";
import { z } from "zod";

// Hapus resource (T-44, Lampiran E.9): objek Storage dihapus DULU, lalu baris.
// Galat Storage selain "tidak ditemukan" -> baris dipertahankan, 500 INTERNAL.

const BUCKET = "resources";
const resourceIdSchema = z.string().uuid();

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ resourceId: string }> },
) {
  try {
    await requireAdmin();
    const { resourceId } = await params;
    if (!resourceIdSchema.safeParse(resourceId).success) {
      return jsonError("NOT_FOUND", 404, "Resource tidak ditemukan.");
    }

    const supabase = getSupabaseAdmin();
    const { data: row, error: fetchError } = await supabase
      .from("resources")
      .select("id, path_penyimpanan")
      .eq("id", resourceId)
      .maybeSingle();
    if (fetchError) throw new Error(`Resource lookup failed: ${fetchError.message}`);
    if (!row) {
      return jsonError("NOT_FOUND", 404, "Resource tidak ditemukan.");
    }

    // Hapus objek lebih dulu. Storage "not found" dianggap sukses; galat lain
    // membiarkan baris tetap ada (E.9).
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([row.path_penyimpanan]);
    if (storageError) {
      const notFound = /not found|not_found|tidak ditemukan/i.test(storageError.message);
      if (!notFound) throw new Error(`Storage delete failed: ${storageError.message}`);
    }

    const { error: deleteError } = await supabase
      .from("resources")
      .delete()
      .eq("id", resourceId);
    if (deleteError) throw new Error(`Resource delete failed: ${deleteError.message}`);

    return jsonOk({ deleted: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
