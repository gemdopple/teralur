import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import { firstMessage, isJsonRequest, zodDetails } from "@/lib/admin-projects";
import { ContractorCreateSchema } from "@/lib/schemas";
import { readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";

// Akun kontraktor (halaman Akun > Kontraktor). Admin membuat akun login Supabase
// (email + kata sandi) SEKALIGUS entitas `contractors` + baris `profiles` dengan
// role 'kontraktor'. Peran inilah yang membuat akun tersebut hanya melihat
// proyek yang ditugaskan kepadanya — bukan cookie yang bisa diubah.
//
// Urutan tulis: buat auth user -> insert contractors -> insert profiles.
// Gagal di tengah: hapus auth user agar tidak tersisa akun tanpa profil.
// Ubah/hapus per akun ada di ./[id]/route.ts.

type ContractorRow = {
  id: string;
  nama: string;
  kontak: string | null;
  user_id: string | null;
  nonaktif: boolean;
  dibuat: string;
};

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await getSupabaseAdmin()
      .from("contractors")
      .select("id, nama, kontak, user_id, nonaktif, dibuat")
      .order("nama", { ascending: true });
    if (error) throw new Error(`Contractor list failed: ${error.message}`);

    const rows = (data ?? []) as ContractorRow[];
    return jsonOk({
      contractors: rows.map((row) => ({
        id: row.id,
        name: row.nama,
        contact: row.kontak,
        hasAccount: row.user_id !== null,
        active: !row.nonaktif,
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
    const parsed = ContractorCreateSchema.safeParse(body.value);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", 422, firstMessage(parsed.error), zodDetails(parsed.error));
    }

    const { nama, kontak, email, password } = parsed.data;
    const supabase = getSupabaseAdmin();

    // 1. Akun login Supabase (email sudah dikonfirmasi agar bisa langsung masuk).
    const { data: created, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError || !created.user) {
      // Email ganda adalah kesalahan input, bukan kesalahan server.
      const sudahAda = /already|registered|exists/i.test(authError?.message ?? "");
      if (sudahAda) {
        return jsonError("VALIDATION_ERROR", 422, "Email sudah terdaftar. Gunakan email lain.");
      }
      console.error("Unable to create contractor auth user:", authError?.message);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }
    const userId = created.user.id;

    // 2. Entitas kontraktor.
    const { data: contractor, error: contractorError } = await supabase
      .from("contractors")
      .insert({ nama, kontak, user_id: userId })
      .select("id")
      .single();
    if (contractorError || !contractor) {
      await supabase.auth.admin.deleteUser(userId);
      console.error("Unable to create contractor row:", contractorError?.message);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }

    // 3. Profil peran: mengikat akun -> kontraktor sebagai role 'kontraktor'.
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ user_id: userId, role: "kontraktor", contractor_id: contractor.id });
    if (profileError) {
      await supabase.from("contractors").delete().eq("id", contractor.id);
      await supabase.auth.admin.deleteUser(userId);
      console.error("Unable to create contractor profile:", profileError.message);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }

    return jsonOk(
      {
        contractor: {
          id: contractor.id,
          name: nama,
          contact: kontak,
          hasAccount: true,
          active: true,
        },
      },
      201,
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}