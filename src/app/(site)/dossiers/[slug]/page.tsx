import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { DossierView } from "@/components/teralur/DossierView";
import { DossierProyek } from "@/components/teralur/DossierProyek";
import {
  getDossierCached,
  getProyekViewData,
} from "@/components/teralur/proyek-view-data";
import { boardToApi, storedBoardSchema } from "@/lib/api-contract";
import { databaseConfigured } from "@/lib/server-api";
import type { Status } from "@/lib/match/types";

// Dossier (Lampiran H.1, T-45): komponen server, render dinamis per-permintaan
// (C-06) supaya penarikan/perubahan admin berlaku seketika. Satu pemanggilan
// data per halaman — getDossier dibungkus React cache() agar generateMetadata
// dan halaman berbagi hasil panggilan yang sama.

export const instant = false;

const STATUSES: Record<string, Status | "catatan_resmi" | undefined> = {
  cocok: "cocok",
  selisih: "selisih",
  tidak_ditemukan: "tidak_ditemukan",
  catatan_resmi: "catatan_resmi",
};

const TEKS_STATUS: Record<string, string> = {
  cocok: "Cocok dengan catatan resmi",
  selisih: "Selisih data, perlu klarifikasi",
  tidak_ditemukan: "Tidak ditemukan di data yang kami miliki",
  catatan_resmi: "Catatan resmi",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!databaseConfigured()) {
    return { title: "Dossier Proyek | Teralur" };
  }
  const data = await getProyekViewData(slug);
  if (!data) {
    // Pemanggilan notFound() di generateMetadata selesai SEBELUM streaming
    // dimulai (metadata menentukan <head> shell), sehingga slug asing, draf,
    // dan proyek ditarik menghasilkan HTTP 404 sungguhan, bukan 200 yang
    // menyusul konten netral (Lampiran H.1; docs not-found.md: "Before
    // streaming starts, Next.js returns a 404 status code").
    notFound();
  }
  // H.1: title = {nama paket dipotong 70 karakter} · teralur; description =
  // status + "Data simulasi" bila demo; robots noindex,nofollow bila demo (C-07).
  const nama = data.packageName.slice(0, 70);
  const statusTeks = TEKS_STATUS[data.status] ?? "";
  const description = statusTeks;
  return {
    title: `${nama} · teralur`,
    description,
    robots: data.demo ? { index: false, follow: false } : undefined,
    openGraph: {
      title: `${nama} · teralur`,
      description,
      images: [{ url: `/evidence/${slug}/opengraph-image` }],
    },
  };
}

export default async function DossierPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Pencarian dilakukan sebelum render apa pun agar notFound() menghasilkan
  // status netral, bukan konten dossier dari fallback yang sudah terkirim.
  await connection();
  const { slug } = await params;
  if (!databaseConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="font-heading text-3xl font-bold">Dossier belum tersedia</h1>
        <p className="mt-3 text-neutral-700">
          Basis data belum dikonfigurasi. Hubungkan Supabase dan impor catatan resmi untuk membuka dossier.
        </p>
      </main>
    );
  }

  const data = await getProyekViewData(slug);
  if (!data) notFound();

  // Proyek admin (v1.1): tata letak H.1 dengan timeRing dan discrepancies
  // yang dihitung server (E.11).
  if (data.jenis === "admin") {
    return (
      <DossierProyek
        slug={data.slug}
        status={data.status}
        demo={data.demo}
        packageName={data.packageName}
        board={data.board}
        record={data.record}
        discrepancies={data.discrepancies}
        timeRing={data.timeRing}
        resources={data.resources}
        visitCounts={data.visitCounts}
      />
    );
  }

  // Jalur v1.0 (foto/cari/catatan resmi) tidak berubah.
  const dossier = await getDossierCached(slug);
  if (!dossier) notFound();
  const status = STATUSES[dossier.submission.status ?? ""];
  if (!status) throw new Error("Dossier tersimpan dengan status yang tidak valid.");
  const parsedBoard =
    dossier.submission.papan === null
      ? null
      : storedBoardSchema.safeParse(dossier.submission.papan);
  if (parsedBoard !== null && !parsedBoard.success) {
    throw new Error("Dossier tersimpan dengan data papan yang tidak valid.");
  }

  return (
    <DossierView
      slug={slug}
      status={status}
      board={parsedBoard?.success ? boardToApi(parsedBoard.data) : null}
      record={dossier.record}
      visitCounts={dossier.visitCounts}
      candidates={dossier.candidates.map((candidate) => ({
        id: candidate.record.id,
        packageName: candidate.record.nama_paket,
        supplier: candidate.record.penyedia,
        contractValue: Number(candidate.record.nilai_kontrak),
        score: candidate.score,
        selected: candidate.record.id === dossier.record?.id,
      }))}
      requiresSelection={dossier.requiresSelection}
    />
  );
}
