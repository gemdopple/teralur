import { connection } from "next/server";
import { redirect } from "next/navigation";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { KelolaAkun, type AkunBaris } from "@/components/teralur/admin/KelolaAkun";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { KotakInfo } from "@/components/teralur/KotakInfo";
import { identitasSaatIni } from "@/lib/identitas";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";

// Akun kontraktor (admin). Konsol admin sudah dilebur ke dasbor, jadi
// pengelolaan akun tinggal di sini bersama akun pemerintah.

export const instant = false;

async function daftarKontraktor(): Promise<AkunBaris[]> {
  if (!databaseConfigured()) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contractors")
    .select("id, nama, kontak, user_id, dibuat")
    .order("nama", { ascending: true });
  if (error) throw new Error(`Contractor list query failed: ${error.message}`);

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authError) throw new Error(`Contractor auth list failed: ${authError.message}`);
  const emailById = new Map(authUsers.users.map((u) => [u.id, u.email ?? ""]));

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.nama as string,
    email: row.user_id ? (emailById.get(row.user_id as string) ?? "") : "",
    contact: (row.kontak as string | null) ?? null,
    hasAccount: row.user_id !== null,
    createdAt: (row.dibuat as string | null) ?? null,
  }));
}

export default async function HalamanAkunKontraktor() {
  await connection();
  const { role: peran } = await identitasSaatIni();
  if (peran !== "admin") redirect("/dashboard");

  const akun = await daftarKontraktor();

  return (
    <>
      <KepalaDasbor
        judul="Akun kontraktor"
        deskripsi="Buat, ubah, dan hapus akun pelaksana. Kontraktor hanya melihat proyek yang ditugaskan kepadanya."
      />
      <Reveal className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {!databaseConfigured() ? (
          <KotakInfo>
            Basis data belum dikonfigurasi. Hubungkan Supabase untuk mengelola akun.
          </KotakInfo>
        ) : (
          <KelolaAkun jenis="kontraktor" awal={akun} />
        )}
      </Reveal>
    </>
  );
}