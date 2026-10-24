import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DossierView } from "@/components/teralur/DossierView";
import { KartuBukti } from "@/components/teralur/KartuBukti";
import {
  getDossierCached,
  getProyekViewData,
} from "@/components/teralur/proyek-view-data";
import { boardToApi, storedBoardSchema } from "@/lib/api-contract";
import { databaseConfigured } from "@/lib/server-api";
import type { Status } from "@/lib/match/types";

// Kartu bukti (Lampiran H.4, T-25): memakai data yang sama dengan dossier
// (satu pemanggilan data, getDossier langsung di server). Terbuka tanpa login;
// tanpa foto pengguna dan tanpa resource.

export const instant = false;

const STATUSES: Record<string, Status | "catatan_resmi" | undefined> = {
  cocok: "cocok",
  selisih: "selisih",
  tidak_ditemukan: "tidak_ditemukan",
  catatan_resmi: "catatan_resmi",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!databaseConfigured()) {
    return { title: "Kartu Bukti | Teralur" };
  }
  const data = await getProyekViewData(slug);
  if (!data) {
    // notFound() sebelum streaming dimulai agar status HTTP 404 sungguhan
    // (sama dengan halaman dossier; Lampiran H.1).
    notFound();
  }
  const nama = data.packageName.slice(0, 70);
  const description = data.demo
    ? "Kartu bukti proyek. Data simulasi."
    : "Kartu bukti proyek publik.";
  return {
    title: `Kartu bukti: ${nama} · teralur`,
    description,
    robots: data.demo ? { index: false, follow: false } : undefined,
  };
}

export default function EvidencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">Memuat kartu bukti…</main>}>
      <EvidenceContent params={params} />
    </Suspense>
  );
}

async function EvidenceContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  if (!databaseConfigured()) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="font-heading text-3xl font-bold">Kartu bukti belum tersedia</h1>
        <p className="mt-3 text-neutral-700">Basis data belum dikonfigurasi.</p>
      </main>
    );
  }

  const data = await getProyekViewData(slug);
  if (!data) notFound();

  // Proyek admin (v1.1): kartu bukti H.4 dengan pita simulasi bila demo.
  if (data.jenis === "admin") {
    return (
      <KartuBukti
        slug={data.slug}
        status={data.status}
        demo={data.demo}
        packageName={data.packageName}
        timeRing={data.timeRing}
        snapshotDate={data.record?.snapshotDate ?? null}
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
      evidenceOnly
    />
  );
}
