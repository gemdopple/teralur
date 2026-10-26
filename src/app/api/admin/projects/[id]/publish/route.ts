import { PublishSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import { firstMessage, isJsonRequest, zodDetails } from "@/lib/admin-projects";
import { z } from "zod";
import { readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";

// Terbitkan / tarik proyek (Lampiran E.6). Idempoten: memanggil ulang dengan
// nilai sama memberi hasil sama. Menerbitkan proyek dinonaktifkan -> 404.

const idSchema = z.string().uuid();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }
    if (!isJsonRequest(request)) {
      return jsonError("VALIDATION_ERROR", 400, "Content-Type harus application/json.");
    }
    const body = await readJsonBody(request);
    if (!body.valid) {
      return jsonError("VALIDATION_ERROR", 400, "Isi permintaan bukan JSON yang valid.");
    }
    const parsed = PublishSchema.safeParse(body.value);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", 422, firstMessage(parsed.error), zodDetails(parsed.error));
    }

    const { data: submission, error: fetchError } = await getSupabaseAdmin()
      .from("submissions")
      .select("id, dinonaktifkan")
      .eq("id", id)
      .maybeSingle();
    if (fetchError) throw new Error(`Project lookup failed: ${fetchError.message}`);
    if (!submission || submission.dinonaktifkan) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }

    const { error: updateError } = await getSupabaseAdmin()
      .from("submissions")
      .update({ terbit: parsed.data.published })
      .eq("id", id);
    if (updateError) throw new Error(`Publish update failed: ${updateError.message}`);

    return jsonOk({ published: parsed.data.published });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
