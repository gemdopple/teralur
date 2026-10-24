import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { EXAMPLE_DOSSIERS } from "@/data/examples";
import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { formatRupiahContoh } from "@/data/examples-format";
import { storedBoardSchema } from "@/lib/api-contract";
import { databaseConfigured } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";

// Galeri contoh kasus (7.5, F-13/Alur C): maksimal 3 proyek unggulan (terbit,
// tidak dinonaktifkan) dari basis data ditautkan langsung ke dossier
// /dossiers/[slug] yang hidup; salinan statis tetap tampil di bawahnya. Bila
// basis data tidak dapat dijangkau, halaman jatuh ke daftar statis saja
// (fallback T-28: tetap berfungsi tanpa API).

export const metadata: Metadata = { title: "Contoh Kasus | Teralur" };

// Render dinamis ringan: daftar unggulan harus segar saat demo (proyek baru
// diterbitkan langsung tampil); satu kueri, halaman tetap cepat.
export const instant = false;

type Unggulan = { slug: string; nama: string; status: DossierStatus };

async function ambilUnggulan(): Promise<Unggulan[]> {
  if (!databaseConfigured()) return [];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("submissions")
      .select("slug, status, papan, records!record_id(nama_paket)")
      .eq("jenis", "admin")
      .eq("terbit", true)
      .eq("dinonaktifkan", false)
      .eq("unggulan", true)
      .limit(3);
    if (error) throw new Error(error.message);
    return (data ?? []).flatMap((row: {
      slug: unknown;
      status: unknown;
      papan: unknown;
      records: unknown;
    }) => {
      const status = row.status;
      if (
        typeof row.slug !== "string" ||
        (status !== "cocok" && status !== "selisih" && status !== "tidak_ditemukan")
      ) {
        return [];
      }
      // Nama paket dari papan; fallback nama catatan resmi.
      const papan = storedBoardSchema.safeParse(row.papan);
      const namaPapan = papan.success ? papan.data.nama_paket : null;
      const rekaman = Array.isArray(row.records) ? row.records[0] : row.records;
      const nama =
        (typeof namaPapan === "string" && namaPapan.trim() !== ""
          ? namaPapan
          : null) ??
        (rekaman && typeof rekaman === "object" && "nama_paket" in rekaman
          ? String((rekaman as { nama_paket: unknown }).nama_paket ?? "")
          : "");
      if (nama === "") return [];
      return [{ slug: row.slug, nama, status }];
    });
  } catch {
    // Fallback T-28: basis data tidak terjangkau — daftar statis tetap tampil.
    return [];
  }
}

export default async function ExamplesPage() {
  await connection();
  const unggulan = await ambilUnggulan();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">
        Kasus contoh · SIMULASI, BUKAN DATA RESMI
      </p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Contoh kasus</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-700">
        Kasus dengan data rekaan yang dibuat untuk memperkenalkan alur Teralur
        tanpa menunjuk proyek atau penyedia nyata. Halaman ini berjalan dari data
        tersimpan sehingga tetap terbuka tanpa koneksi ke API.
      </p>

      {unggulan.length > 0 ? (
        <section className="mt-6" aria-label="Proyek unggulan">
          <h2 className="font-heading text-xl font-bold">Proyek unggulan</h2>
          <p className="mt-1 text-sm text-neutral-700">
            Dossier lengkap yang sudah diterbitkan, terbuka langsung.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unggulan.map((proyek) => (
              <Link
                key={proyek.slug}
                href={`/dossiers/${proyek.slug}`}
                className="block rounded-xl border-2 border-black bg-kuning-papan/40 p-4 transition hover:bg-kuning-papan/60"
              >
                <ChipStatus status={proyek.status} />
                <p className="mt-3 font-semibold leading-snug">{proyek.nama}</p>
                <p className="mt-2 text-xs text-neutral-700">
                  Buka dossier →
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8" aria-label="Kasus contoh statis">
        <h2 className="font-heading text-xl font-bold">Kasus contoh ringkas</h2>
        <p className="mt-1 text-sm text-neutral-700">
          Tiga kasus contoh dengan data rekaan yang diperiksa manual oleh tim.
          Galeri kasus nyata yang sudah diverifikasi tim menyusul.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_DOSSIERS.map((contoh) => (
            <Link
              key={contoh.exampleId}
              href={`/examples/${contoh.exampleId}`}
              className="block rounded-xl border-2 border-black bg-white p-4 transition hover:bg-[#F5F5F5]"
            >
              <ChipStatus status={contoh.status} />
              <p className="mt-3 font-semibold leading-snug">{contoh.judul}</p>
              <p className="mt-2 text-sm text-neutral-700">
                {contoh.record ? formatRupiahContoh(contoh.record.nilai_kontrak) : "Nilai tidak ditemukan di catatan"}
              </p>
              <p className="mt-2 text-xs text-neutral-600">{contoh.ringkasanVerifikasi}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
