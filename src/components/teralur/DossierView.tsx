import Link from "next/link";
import { Cincin } from "@/components/teralur/Cincin";
import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { CandidateSelector, type CandidateChoice } from "@/components/teralur/CandidateSelector";
import { LabelTiga } from "@/components/teralur/LabelTiga";
import { PanelJejak } from "@/components/teralur/PanelJejak";
import { VisitReportForm } from "@/components/teralur/VisitReportForm";
import { hitungCincin } from "@/lib/cincin";
import type { ApiBoard } from "@/lib/api-contract";
import type { RecordRow } from "@/lib/server-api";

type Props = {
  slug: string;
  status: DossierStatus;
  board: ApiBoard | null;
  record: RecordRow | null;
  visitCounts: { active: number; no_activity_seen: number; appears_complete: number };
  candidates: CandidateChoice[];
  requiresSelection: boolean;
  evidenceOnly?: boolean;
  // Data statis contoh (F-13): mengganti pita "Data resmi" dengan label simulasi (§9.1.5).
  simulasi?: boolean;
};

function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Belum diketahui";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Belum diketahui";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00Z`),
  );
}

export function DossierView({
  slug,
  status,
  board,
  record,
  visitCounts,
  candidates,
  requiresSelection,
  evidenceOnly = false,
  simulasi = false,
}: Props) {
  const ring = hitungCincin({
    masaHari: board?.durationDays ?? record?.masa_hari ?? null,
    tanggalMulai: record?.tanggal_kontrak ?? board?.contractDate ?? null,
    hariIni: new Date(),
  });
  const rows = [
    {
      label: "Nama paket",
      board: board?.packageName ?? null,
      record: record?.nama_paket ?? null,
    },
    {
      label: "Penyedia",
      board: board?.supplier ?? null,
      record: record?.penyedia ?? null,
    },
    {
      label: "Nilai kontrak",
      board: board?.contractValue === null || board?.contractValue === undefined ? null : formatRupiah(board.contractValue),
      record: record ? formatRupiah(Number(record.nilai_kontrak)) : null,
    },
    {
      label: "Tanggal kontrak",
      board: board?.contractDate ? formatDate(board.contractDate) : null,
      record: record?.tanggal_kontrak ? formatDate(record.tanggal_kontrak) : null,
    },
    {
      label: "Masa pelaksanaan",
      board: board?.durationDays ? `${board.durationDays} hari kalender` : null,
      record: record?.masa_hari ? `${record.masa_hari} hari kalender` : null,
    },
    {
      label: "Tahun anggaran",
      board: board?.fiscalYear === null || board?.fiscalYear === undefined ? null : String(board.fiscalYear),
      record: record?.tahun === null || record?.tahun === undefined ? null : String(record.tahun),
    },
    {
      label: "Sumber dana",
      board: board?.fundingSource ?? null,
      record: null,
    },
    {
      label: "Satuan kerja",
      board: board?.agencyUnit ?? null,
      record: record?.satuan_kerja ?? null,
    },
    {
      label: "Nomor kontrak",
      board: board?.contractNumber ?? null,
      record: null,
    },
    {
      label: "Lokasi",
      board: board?.locationText ?? null,
      record: null,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">
            {evidenceOnly ? "Kartu bukti" : "Dossier proyek"}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold">
            {record?.nama_paket ?? board?.packageName ?? "Nama paket belum diketahui"}
          </h1>
        </div>
        <ChipStatus status={status} />
      </div>

      {simulasi ? (
        <p className="mt-4 inline-flex border border-black bg-[#FFC400] px-3 py-2 text-sm font-semibold">
          SIMULASI, BUKAN DATA RESMI. Kasus contoh untuk memperkenalkan alur Teralur.
        </p>
      ) : (
        record && (
          <p className="mt-4 inline-flex border border-black bg-[#FFC400] px-3 py-2 text-sm font-semibold">
            Data resmi per {formatDate(record.snapshot_tanggal)}. Bukan data real-time.
          </p>
        )
      )}

      <section className="mt-6 grid gap-6 rounded-xl border-2 border-black bg-white p-5 md:grid-cols-[1fr_13rem]">
        <div>
          <h2 className="font-heading text-xl font-bold">Papan dan catatan resmi</h2>
          {status === "catatan_resmi" && (
            <p className="mt-2 text-sm text-neutral-700">
              Tidak ada papan untuk dibandingkan. Informasi berikut berasal dari catatan resmi.
            </p>
          )}
          <div className="mt-4 divide-y divide-neutral-200">
            {rows.map((row) => (
              <div key={row.label} className="grid gap-3 py-3 sm:grid-cols-[1fr_1fr_1fr]">
                <div className="font-semibold">
                  {row.label}
                  <LabelTiga label={row.board || row.record ? "tercatat" : "belum_diketahui"} className="ml-2" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Papan</p>
                  <p className="text-sm">{row.board ?? "Belum diketahui"}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Catatan resmi</p>
                  <p className="text-sm">{row.record ?? "Tidak ditemukan"}</p>
                </div>
              </div>
            ))}
          </div>
          {status === "selisih" && (
            <p className="mt-3 rounded-md border-l-4 border-[#D9480F] bg-orange-50 p-3 text-sm">
              Perbedaan sering wajar, misalnya karena addendum atau perubahan kontrak. Perlu klarifikasi.
            </p>
          )}
        </div>
        <div className="flex items-center justify-center border-t border-neutral-200 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
          <Cincin data={ring} />
        </div>
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <PanelJejak
          judul="Jejak sumber"
          baris={[
            { label: "Sumber papan", nilai: board ? "Isian pengguna dari foto atau input manual; belum diverifikasi tim." : "Tidak ada papan untuk dibandingkan." },
            { label: "ID catatan resmi", nilai: record?.id_sumber ?? "Belum diketahui" },
            { label: "Sumber data", nilai: record?.sumber ?? "Catatan resmi belum tersedia" },
            { label: "Tanggal snapshot", nilai: record ? formatDate(record.snapshot_tanggal) : "Belum diketahui" },
            { label: "Rumus cincin", nilai: "Hari berjalan dibagi masa pelaksanaan; bukan persen kemajuan fisik." },
          ]}
        />
        {!evidenceOnly && (
          <section className="rounded-xl border border-neutral-300 bg-white p-5">
            <h2 className="font-heading text-xl font-bold">Laporan warga</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Belum diverifikasi; jumlah saja, bukan ukuran kemajuan. <LabelTiga label="belum_diketahui" />
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>Ada aktivitas pekerjaan: {visitCounts.active}</li>
              <li>Tidak terlihat aktivitas: {visitCounts.no_activity_seen}</li>
              <li>Tampak selesai: {visitCounts.appears_complete}</li>
            </ul>
          </section>
        )}
      </div>

      {!evidenceOnly && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {candidates.length > 1 && (
            <CandidateSelector
              slug={slug}
              candidates={candidates}
              requiresSelection={requiresSelection}
            />
          )}
          <VisitReportForm dossierSlug={slug} />
          <section className="rounded-xl border border-neutral-300 bg-white p-5">
            <h2 className="font-heading text-xl font-bold">Batas informasi</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              Informasi papan dikonfirmasi oleh pengguna dan belum diverifikasi tim Teralur. Catatan resmi
              berasal dari data publik per {record ? formatDate(record.snapshot_tanggal) : "tanggal snapshot yang tersedia"}
              {" "}dan mungkin belum memuat perubahan kontrak. Perbedaan tidak berarti kesalahan.
            </p>
            <Link href={`/evidence/${slug}`} className="mt-4 inline-block rounded-md border-2 border-black bg-[#FFC400] px-4 py-2 font-semibold">
              Buat kartu bukti
            </Link>
          </section>
        </div>
      )}
      {evidenceOnly && (
        <p className="mt-6 border-t border-black/20 pt-4 text-sm text-neutral-700">
          Informasi papan dikonfirmasi pengguna dan belum diverifikasi tim Teralur. Perbedaan tidak berarti kesalahan.
          Sumber data publik: OCDS (Opentender/ICW), lisensi ODbL.
        </p>
      )}
    </main>
  );
}
