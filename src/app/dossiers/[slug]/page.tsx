import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DossierView } from "@/components/teralur/DossierView";
import { boardToApi, storedBoardSchema } from "@/lib/api-contract";
import { databaseConfigured, getDossier } from "@/lib/server-api";
import type { Status } from "@/lib/match/types";

export const metadata: Metadata = { title: "Dossier Proyek | Teralur" };

const STATUSES: Record<string, Status | "catatan_resmi" | undefined> = {
  cocok: "cocok",
  selisih: "selisih",
  tidak_ditemukan: "tidak_ditemukan",
  catatan_resmi: "catatan_resmi",
};

export default function DossierPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">Memuat dossier…</main>}>
      <DossierContent params={params} />
    </Suspense>
  );
}

async function DossierContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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

  const data = await getDossier(slug);
  if (!data) notFound();
  const status = STATUSES[data.submission.status ?? ""];
  if (!status) throw new Error("Dossier tersimpan dengan status yang tidak valid.");
  const parsedBoard =
    data.submission.papan === null ? null : storedBoardSchema.safeParse(data.submission.papan);
  if (parsedBoard !== null && !parsedBoard.success) {
    throw new Error("Dossier tersimpan dengan data papan yang tidak valid.");
  }

  return (
    <DossierView
      slug={slug}
      status={status}
      board={parsedBoard?.success ? boardToApi(parsedBoard.data) : null}
      record={data.record}
      visitCounts={data.visitCounts}
      candidates={data.candidates.map((candidate) => ({
        id: candidate.record.id,
        packageName: candidate.record.nama_paket,
        supplier: candidate.record.penyedia,
        contractValue: Number(candidate.record.nilai_kontrak),
        score: candidate.score,
        selected: candidate.record.id === data.record?.id,
      }))}
      requiresSelection={data.requiresSelection}
    />
  );
}
