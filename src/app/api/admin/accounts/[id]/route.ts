import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import { firstMessage, isJsonRequest, zodDetails } from "@/lib/admin-projects";
import { PemerintahUpdateSchema } from "@/lib/schemas";
import { readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";

// Satu akun pemerintah: ubah (PATCH) dan hapus (DELETE).
// Id = auth user id, sekaligus primary key `profiles.user_id`.
//
// Hapus hanya bekerja untuk baris ber-role 'pemerintah'. Akun admin (allowlist
// ADMIN_EMAILS) tidak boleh lenyap lewat endpoint ini — kalau tidak, admin bisa
// mengunci diri sendiri keluar dari dasbor.

const idSchema = z.string().uuid();

type Profil = { user_id: string; role: string; nama: string | null };

async function ambil(userId: string): Promise<Profil | null> {
  const supabase = getSupabaseAdmin();
  // `profiles.nama` baru ada sejak migrasi 0006; sebelum itu baca tanpa label.
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, role, nama")
    .eq("user_id", userId)
    .maybeSingle();
  if (error && /nama/i.test(error.message ?? "")) {
    const fallback = await supabase
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", userId)
      .maybeSingle();
    if (fallback.error) throw new Error(`Government account lookup failed: ${fallback.error.message}`);
    return fallback.data ? { ...(fallback.data as Omit<Profil, "nama">), nama: null } : null;
  }
  if (error) throw new Error(`Government account lookup failed: ${error.message}`);
  return (data as Profil | null) ?? null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return jsonError("NOT_FOUND", 404, "Akun tidak ditemukan.");
    }
    if (!isJsonRequest(request)) {
      return jsonError("VALIDATION_ERROR", 400, "Content-Type harus application/json.");
    }
    const body = await readJsonBody(request);
    if (!body.valid) {
      return jsonError("VALIDATION_ERROR", 400, "Isi permintaan bukan JSON yang valid.");
    }
    const parsed = PemerintahUpdateSchema.safeParse(body.value);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", 422, firstMessage(parsed.error), zodDetails(parsed.error));
    }

    const existing = await ambil(id);
    if (!existing || existing.role !== "pemerintah") {
      return jsonError("NOT_FOUND", 404, "Akun tidak ditemukan.");
    }

    const { nama, email, password } = parsed.data;
    const supabase = getSupabaseAdmin();

    if (nama !== undefined) {
      const { error } = await supabase.from("profiles").update({ nama }).eq("user_id", id);
      // Kolom belum ada (0006 belum dijalankan): label belum bisa disimpan.
      if (error && /nama/i.test(error.message ?? "")) {
        return jsonError(
          "VALIDATION_ERROR",
          422,
          "Kolom nama belum ada di basis data. Jalankan migrasi 0006_hapus_terbit.sql lebih dulu.",
        );
      }
      if (error) throw new Error(`Government profile update failed: ${error.message}`);
    }

    if (email !== undefined || password !== undefined) {
      const { error } = await supabase.auth.admin.updateUserById(id, {
        ...(email !== undefined ? { email, email_confirm: true } : {}),
        ...(password !== undefined ? { password } : {}),
      });
      if (error) {
        const sudahAda = /already|registered|exists/i.test(error.message ?? "");
        if (sudahAda) {
          return jsonError("VALIDATION_ERROR", 422, "Email sudah terdaftar. Gunakan email lain.");
        }
        throw new Error(`Government auth update failed: ${error.message}`);
      }
    }

    const sesudah = await ambil(id);
    const { data: authUser } = await supabase.auth.admin.getUserById(id);
    return jsonOk({
      account: {
        id,
        name: sesudah?.nama ?? authUser?.user?.email ?? "(tanpa nama)",
        email: authUser?.user?.email ?? "",
        hasAccount: true,
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return jsonError("NOT_FOUND", 404, "Akun tidak ditemukan.");
    }

    const existing = await ambil(id);
    // Akun admin (tanpa baris profil pemerintah) sengaja tidak bisa dihapus di sini.
    if (!existing || existing.role !== "pemerintah") {
      return jsonError("NOT_FOUND", 404, "Akun tidak ditemukan.");
    }

    const supabase = getSupabaseAdmin();
    const { error: profileError } = await supabase.from("profiles").delete().eq("user_id", id);
    if (profileError) throw new Error(`Government profile delete failed: ${profileError.message}`);

    // Menghapus auth user juga menghapus cookie sesinya di kunjungan berikutnya.
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw new Error(`Government auth delete failed: ${authError.message}`);

    return jsonOk({ deleted: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}