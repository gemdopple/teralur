import "server-only";
import { getSupabaseAdmin } from "@/lib/db";

export type OpsiKontraktorProyek = { id: string; nama: string };

export async function daftarKontraktorAktif(): Promise<OpsiKontraktorProyek[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("contractors")
    .select("id, nama")
    .eq("nonaktif", false)
    .order("nama", { ascending: true });
  if (error) throw new Error(`Project contractor options failed: ${error.message}`);
  return (data ?? []) as OpsiKontraktorProyek[];
}

export async function daftarSatuanKerjaPemerintah(): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("nama")
    .eq("role", "pemerintah")
    .not("nama", "is", null)
    .order("nama", { ascending: true });
  if (error) {
    const belumAdaKolomNama =
      ["42703", "PGRST204"].includes(error.code ?? "") &&
      /profiles\.nama|column ['"]?nama['"]? of relation ['"]?profiles|could not find ['"]nama['"] column of ['"]profiles/i.test(
        error.message,
      );
    if (!belumAdaKolomNama) {
      throw new Error(`Project agency-unit options failed: ${error.message}`);
    }

    console.warn(
      "Government work-unit options are unavailable because profiles.nama is missing. " +
        "Apply supabase/migrations/0006_hapus_terbit.sql to enable saved government account names.",
    );
    return [];
  }

  return [
    ...new Set(
      (data ?? []).map((row) => row.nama?.trim()).filter((nama): nama is string => Boolean(nama)),
    ),
  ];
}
