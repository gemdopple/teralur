import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import { firstMessage, isJsonRequest, zodDetails } from "@/lib/admin-projects";
import { PemerintahCreateSchema } from "@/lib/schemas";
import { readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";

// Akun pemerintah (halaman Akun > Pemerintah).
//
// Tidak seperti kontraktor, pemerintah tidak punya entitas tersendiri: yang
// disimpan hanyalah baris `profiles` (role 'pemerintah' + label `nama`) yang
// menaut ke akun login Supabase. Hapus per akun ada di ./[id]/route.ts dengan
// id = auth user id (profiles tidak punya id sendiri; PK-nya user_id).

type ProfilPemerintah = {
  user_id: string;
  nama: string | null;
  dibuat: string;
};

/** Daftar profil pemerintah + email dari auth.users. */
export async function GET() {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, nama, dibuat")
      .eq("role", "pemerintah")
      .order("dibuat", { ascending: true });
    if (error) throw new Error(`Government list failed: ${error.message}`);

    // Email tidak tersimpan di profiles; ambil dari auth (satu halaman cukup
    // untuk skala aplikasi ini).
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (authError) throw new Error(`Government auth list failed: ${authError.message}`);
    const emailByid = new Map(authUsers.users.map((u) => [u.id, u.email ?? ""]));

    return jsonOk({
      accounts: ((data ?? []) as ProfilPemerintah[]).map((row) => ({
        id: row.user_id,
        name: row.nama ?? emailByid.get(row.user_id) ?? "(tanpa nama)",
        email: emailByid.get(row.user_id) ?? "",
        hasAccount: true,
        createdAt: row.dibuat,
      })),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    if (!isJsonRequest(request)) {
      return jsonError("VALIDATION_ERROR", 400, "Content-Type harus application/json.");
    }
    const body = await readJsonBody(request);
    if (!body.valid) {
      return jsonError("VALIDATION_ERROR", 400, "Isi permintaan bukan JSON yang valid.");
    }
    const parsed = PemerintahCreateSchema.safeParse(body.value);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", 422, firstMessage(parsed.error), zodDetails(parsed.error));
    }

    const { nama, email, password } = parsed.data;
    const supabase = getSupabaseAdmin();

    // 1. Akun login Supabase (email dikonfirmasi agar bisa langsung masuk).
    const { data: created, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError || !created.user) {
      const sudahAda = /already|registered|exists/i.test(authError?.message ?? "");
      if (sudahAda) {
        return jsonError("VALIDATION_ERROR", 422, "Email sudah terdaftar. Gunakan email lain.");
      }
      throw new Error(`Government auth create failed: ${authError?.message ?? "tanpa data"}`);
    }
    const userId = created.user.id;

    // 2. Profil peran pemerintah. Gagal -> batalkan akun login.
    //    `profiles.nama` baru ada sejak migrasi 0006; sebelum itu cukup buat
    //    profil tanpa label (label jatuh ke email di daftar).
    let profileError = (
      await supabase.from("profiles").insert({ user_id: userId, role: "pemerintah", nama })
    ).error;
    if (profileError && /nama/i.test(profileError.message ?? "")) {
      profileError = (
        await supabase.from("profiles").insert({ user_id: userId, role: "pemerintah" })
      ).error;
    }
    if (profileError) {
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Government profile insert failed: ${profileError.message}`);
    }

    return jsonOk(
      {
        account: {
          id: userId,
          name: nama,
          email,
          hasAccount: true,
        },
      },
      201,
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}