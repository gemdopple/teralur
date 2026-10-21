import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DossierView } from "@/components/teralur/DossierView";
import { ambilContoh, EXAMPLE_DOSSIERS } from "@/data/examples";
import type { RecordRow } from "@/lib/server-api";

export function generateStaticParams(): { exampleId: string }[] {
  return EXAMPLE_DOSSIERS.map((d) => ({ exampleId: d.exampleId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ exampleId: string }>;
}): Promise<Metadata> {
  const { exampleId } = await params;
  const contoh = ambilContoh(exampleId);
  return { title: contoh ? `${contoh.judul} | Contoh Kasus | Teralur` : "Contoh Kasus | Teralur" };
}

export default async function ExampleDetailPage({
  params,
}: {
  params: Promise<{ exampleId: string }>;
}) {
  const { exampleId } = await params;
  const contoh = ambilContoh(exampleId);
  if (!contoh) notFound();

  // Baris catatan resmi statis dari data contoh — tidak ada panggilan basis data.
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
      <p className="mx-auto w-full max-w-5xl px-4 pt-6 text-sm font-semibold text-[#D9480F]">
        SIMULASI, BUKAN DATA RESMI — {contoh.ringkasanVerifikasi}
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
