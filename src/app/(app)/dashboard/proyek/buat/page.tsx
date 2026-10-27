import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { FormProyek } from "@/components/teralur/admin/FormProyek";
import { jakartaToday } from "@/lib/dates";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";
import { identitasSaatIni } from "@/lib/identitas";

// Buat proyek untuk admin. Sebelumnya ada di konsol admin (/admin/projects/new);
// kini satu tempat dengan alur pemerintah di /dashboard/proyek/baru, agar
// sidebar hanya punya satu pintu masuk. Government tidak pernah sampai ke sini
// (dialihkan ke halaman penugasan miliknya).

export const metadata: Metadata = { title: "Buat proyek | Dasbor Teralur" };
export const instant = false;

export default async function AdminBuatProyekPage() {
  await connection();
  const { role: peran } = await identitasSaatIni();

  if (peran === "pemerintah") redirect("/dashboard/proyek/baru");
  if (peran !== "admin") redirect("/dashboard/proyek");

  let kontraktor: { id: string; nama: string }[] = [];
  if (databaseConfigured()) {
    const { data } = await getSupabaseAdmin()
      .from("contractors")
      .select("id, nama")
      .eq("nonaktif", false)
      .order("nama", { ascending: true });
    kontraktor = (data ?? []) as { id: string; nama: string }[];
  }

  return (
    <>
      <KepalaDasbor
        judul="Buat proyek"
        deskripsi="Masukkan data papan lapangan dan catatan resmi, tetapkan kontraktor pelaksana, lalu simpan."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <FormProyek
          mode="create"
          today={jakartaToday()}
          kembaliKe="/dashboard/proyek"
          kontraktor={kontraktor}
        />
      </div>
    </>
  );
}