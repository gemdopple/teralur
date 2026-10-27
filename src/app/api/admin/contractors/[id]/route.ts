import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import { firstMessage, isJsonRequest, zodDetails } from "@/lib/admin-projects";
import { ContractorUpdateSchema } from "@/lib/schemas";
import { readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";

// Satu akun kontraktor: ubah (PATCH) dan hapus (DELETE). Id di sini adalah
// `contractors.id`, bukan auth user id.
//
// Hapus akun menghapus akun login (auth.users) sekaligus. Bila kontraktor masih
// memegang proyek, penghapusan DITOLAK: admin harus melepas penugasan lebih dulu
// agar tidak ada proyek yang pemiliknya menghilang diam-diam.

const idSchema = z.string().uuid();

type ContractorRow = {
  id: string;
  nama: string;
  kontak: string | null;
  user_id: string | null;
  nonaktif: boolean;
  dibuat: string;
};

async function ambil(id: string): Promise<ContractorRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("contractors")
    .select("id, nama, kontak, user_id, nonaktif, dibuat")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Contractor lookup failed: ${error.message}`);
  return (data as ContractorRow | null) ?? null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return jsonError("NOT_FOUND", 404, "Kontraktor tidak ditemukan.");
    }
    if (!isJsonRequest(request)) {
      return jsonError("VALIDATION_ERROR", 400, "Content-Type harus application/json.");
    }
    const body = await readJsonBody(request);
    if (!body.valid) {
      return jsonError("VALIDATION_ERROR", 400, "Isi permintaan bukan JSON yang valid.");
    }
    const parsed = ContractorUpdateSchema.safeParse(body.value);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", 422, firstMessage(parsed.error), zodDetails(parsed.error));
    }

    const existing = await ambil(id);
    if (!existing) return jsonError("NOT_FOUND", 404, "Kontraktor tidak ditemukan.");

    const { nama, kontak, email, password } = parsed.data;
    const supabase = getSupabaseAdmin();

    if (nama !== undefined || kontak !== undefined) {
      const { error } = await supabase
        .from("contractors")
        .update({ ...(nama !== undefined ? { nama } : {}), ...(kontak !== undefined ? { kontak } : {}) })
        .eq("id", id);
      if (error) throw new Error(`Contractor update failed: ${error.message}`);
    }

    // Email dan kata sandi hidup di auth.users, bukan di `contractors`.
    if (existing.user_id && (email !== undefined || password !== undefined)) {
      const { error } = await supabase.auth.admin.updateUserById(existing.user_id, {
        ...(email !== undefined ? { email, email_confirm: true } : {}),
        ...(password !== undefined ? { password } : {}),
      });
      if (error) {
        const sudahAda = /already|registered|exists/i.test(error.message ?? "");
        if (sudahAda) {
          return jsonError("VALIDATION_ERROR", 422, "Email sudah terdaftar. Gunakan email lain.");
        }
        throw new Error(`Contractor auth update failed: ${error.message}`);
      }
    } else if (!existing.user_id && (email !== undefined || password !== undefined)) {
      return jsonError(
        "VALIDATION_ERROR",
        422,
        "Kontraktor ini belum punya akun login, jadi email dan kata sandi tidak bisa diubah.",
      );
    }

    const sesudah = await ambil(id);
    return jsonOk({
      contractor: {
        id: sesudah!.id,
        name: sesudah!.nama,
        contact: sesudah!.kontak,
        hasAccount: sesudah!.user_id !== null,
        active: !sesudah!.nonaktif,
        email,
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
      return jsonError("NOT_FOUND", 404, "Kontraktor tidak ditemukan.");
    }

    const existing = await ambil(id);
    if (!existing) return jsonError("NOT_FOUND", 404, "Kontraktor tidak ditemukan.");

    const supabase = getSupabaseAdmin();

    // Tolak bila masih memegang proyek: lebih baik admin melepas penugasan dulu
    // daripada proyek kehilangan pelaksana tanpa disadari.
    const { count, error: countError } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("contractor_id", id)
      .eq("jenis", "admin")
      .eq("dinonaktifkan", false);
    if (countError) throw new Error(`Contractor assignment count failed: ${countError.message}`);
    if ((count ?? 0) > 0) {
      return jsonError(
        "VALIDATION_ERROR",
        422,
        `Kontraktor masih memegang ${count} proyek. Lepaskan penugasan itu dulu sebelum menghapus akun.`,
      );
    }

    // Urutan hapus kebalikan urutan buat: profil -> entitas -> akun login.
    if (existing.user_id) {
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", existing.user_id);
      if (profileError) throw new Error(`Contractor profile delete failed: ${profileError.message}`);
    }

    const { error: rowError } = await supabase.from("contractors").delete().eq("id", id);
    if (rowError) throw new Error(`Contractor row delete failed: ${rowError.message}`);

    if (existing.user_id) {
      const { error: authError } = await supabase.auth.admin.deleteUser(existing.user_id);
      if (authError) throw new Error(`Contractor auth delete failed: ${authError.message}`);
    }

    return jsonOk({ deleted: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}