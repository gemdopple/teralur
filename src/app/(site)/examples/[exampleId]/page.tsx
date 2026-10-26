import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DossierProyek } from "@/components/teralur/DossierProyek";
import { DossierView } from "@/components/teralur/DossierView";
import { ambilContoh, EXAMPLE_DOSSIERS } from "@/data/examples";
import { dossierDemo, KUNCI_STATIS_TERBIT, namaDemo } from "@/data/proyek-demo";
import { jakartaToday } from "@/lib/dates";
import type { RecordRow } from "@/lib/server-api";

// Dua sumber data, semuanya statis tanpa API (F-13):
//  1. exampleId "demo-001" dst. — salinan statis seluruh proyek seed terbit
//     (Lampiran M; draf demo-010 tidak dilayani), dossier lengkap memakai
//     tata letak v2 (DossierProyek chart-first);
//  2. exampleId "contoh-*" warisan v1.0 — dipertahankan untuk tautan lama.
// Cincin memakai tanggal hari ini sehingga halaman tetap dirender dinamis.
export const instant = false;

const SEMUA_ID = [...KUNCI_STATIS_TERBIT, ...EXAMPLE_DOSSIERS.map((d) => d.exampleId)];

export function generateStaticParams(): { exampleId: string }[] {
  return SEMUA_ID.map((exampleId) => ({ exampleId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exampleId: string }>;
}): Promise<Metadata> {
  const { exampleId } = await params;
  if (!SEMUA_ID.includes(exampleId)) {
    // Diputuskan sebelum streaming dimulai (pola yang sama dengan dossier,
    // Lampiran H.1) sehingga exampleId tak dikenal menghasilkan HTTP 404
    // sungguhan, bukan soft 404.
    notFound();
  }
  const nama = namaDemo(exampleId);
  if (nama) {
    // C-07: data demo diberi noindex, sama dengan dossier daring. Nama dari
    // spesifikasi statis (tanpa jakartaToday) agar metadata tetap prerenderable.
    return {
      title: `${nama.slice(0, 70)} · teralur`,
      description: "Salinan tersimpan proyek contoh.",
      robots: { index: false, follow: false },
    };
  }
  const contoh = ambilContoh(exampleId);
  return { title: contoh ? `${contoh.judul} | Contoh Kasus | Teralur` : "Contoh Kasus | Teralur" };
}

export default async function ExampleDetailPage({
  params,
}: {
  params: Promise<{ exampleId: string }>;
}) {
  const { exampleId } = await params;
  await connection();

  // Salinan statis (T-28 mode cadangan, diperluas ke seluruh seed terbit):
  // tanggal kontrak dihitung dari offset hari yang sama dengan seed sehingga
  // keadaan cincin tetap sesuai M.2 pada hari mana pun; status dihitung
  // compare() produksi.
  const demo = KUNCI_STATIS_TERBIT.includes(exampleId)
    ? dossierDemo(exampleId, jakartaToday())
    : null;
  if (demo) {
    return (
      <DossierProyek
        slug={demo.exampleId}
        status={demo.status}
        demo
        packageName={demo.packageName}
        board={demo.board}
        record={demo.record}
        discrepancies={demo.discrepancies}
        timeRing={demo.timeRing}
        resources={[]}
        visitCounts={{ active: 0, no_activity_seen: 0, appears_complete: 0 }}
        statis
      />
    );
  }

  // Jalur v1.0 (contoh-*) tidak berubah.
  const contoh = ambilContoh(exampleId);
  if (!contoh) notFound();

  // Baris catatan resmi statis dari data contoh — tanpa panggilan basis data.
  const record: RecordRow | null = contoh.record
    ? {
        id: contoh.record.id_sumber,
        id_sumber: contoh.record.id_sumber,
        sumber: contoh.record.sumber,
        nama_paket: contoh.record.nama_paket,
        penyedia: contoh.record.penyedia,
        nilai_kontrak: contoh.record.nilai_kontrak,
        tanggal_kontrak: contoh.record.tanggal_kontrak,
        masa_hari: contoh.record.masa_hari,
        tahun: contoh.record.tahun,
        satuan_kerja: contoh.record.satuan_kerja,
        snapshot_tanggal: contoh.record.snapshot_tanggal,
      }
    : null;

  return (
    <div className="flex flex-1 flex-col">
      <p className="mx-auto w-full max-w-5xl px-4 pt-6 text-sm font-semibold text-selisih">
        CONTOH KASUS — {contoh.ringkasanVerifikasi}
      </p>
      <DossierView
        slug={contoh.exampleId}
        status={contoh.status}
        board={contoh.board}
        record={record}
        visitCounts={{ active: 0, no_activity_seen: 0, appears_complete: 0 }}
        candidates={[]}
        requiresSelection={false}
        simulasi
      />
    </div>
  );
}
