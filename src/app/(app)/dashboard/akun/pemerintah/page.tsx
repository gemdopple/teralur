import { connection } from "next/server";
import { redirect } from "next/navigation";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { KelolaAkun, type AkunBaris } from "@/components/teralur/admin/KelolaAkun";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { KotakInfo } from "@/components/teralur/KotakInfo";
import { identitasSaatIni } from "@/lib/identitas";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";

// Akun pemerintah (admin). Pemerintah tidak punya entitas tersendiri seperti
// kontraktor: yang dikelola adalah baris `profiles` ber-role pemerintah beserta
// akun login-nya. Label akun disimpan di `profiles.nama`.

export const instant = false;

type ProfilPemerintah = { user_id: string; nama: string | null; dibuat: string | null };

async function daftarPemerintah(): Promise<AkunBaris[]> {
  if (!databaseConfigured()) return [];
  const supabase = getSupabaseAdmin();

  // `profiles.nama` baru ada sejak migrasi 0006. Sebelum itu diterapkan,
  // halaman tetap harus terbuka (label jatuh ke email), bukan 500.
  let rows: ProfilPemerintah[] = [];
  const denganNama = await supabase
    .from("profiles")
    .select("user_id, nama, dibuat")
    .eq("role", "pemerintah")
    .order("dibuat", { ascending: true });
  if (denganNama.error) {
    const tanpaNama = await supabase
      .from("profiles")
      .select("user_id, dibuat")
      .eq("role", "pemerintah")
      .order("dibuat", { ascending: true });
    if (tanpaNama.error) throw new Error(`Government list query failed: ${tanpaNama.error.message}`);
    rows = ((tanpaNama.data ?? []) as Omit<ProfilPemerintah, "nama">[]).map((r) => ({ ...r, nama: null }));
  } else {
    rows = (denganNama.data ?? []) as ProfilPemerintah[];
  }

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authError) throw new Error(`Government auth list failed: ${authError.message}`);
  const emailById = new Map(authUsers.users.map((u) => [u.id, u.email ?? ""]));

  return rows.map((row) => ({
    id: row.user_id,
    name: row.nama ?? emailById.get(row.user_id) ?? "(tanpa nama)",
    email: emailById.get(row.user_id) ?? "",
    contact: null,
    hasAccount: true,
    createdAt: row.dibuat,
  }));
}

export default async function HalamanAkunPemerintah() {
  await connection();
  const { role: peran } = await identitasSaatIni();
  if (peran !== "admin") redirect("/dashboard");

  const akun = await daftarPemerintah();

  return (
    <>
      <KepalaDasbor
        judul="Akun pemerintah"
        deskripsi="Buat, ubah, dan hapus akun instansi pemerintah yang memantau proyek wilayah kerja."
      />
      <Reveal className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {!databaseConfigured() ? (
          <KotakInfo>
            Basis data belum dikonfigurasi. Hubungkan Supabase untuk mengelola akun.
          </KotakInfo>
        ) : (
          <KelolaAkun jenis="pemerintah" awal={akun} />
        )}
      </Reveal>
    </>
  );
}