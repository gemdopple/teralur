import Link from "next/link";
import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { CincinWaktu } from "@/components/teralur/Cincin";
import { DaftarResource, type ResourcePublik } from "@/components/teralur/DaftarResource";
import { LabelTiga } from "@/components/teralur/LabelTiga";
import { PitaData, PitaSimulasi } from "@/components/teralur/PitaSimulasi";
import { PanelJejak } from "@/components/teralur/PanelJejak";
import {
  TabelPapanCatatan,
  type BarisPapanCatatan,
  type SelisihProyek,
} from "@/components/teralur/TabelPapanCatatan";
import { VisitReportForm } from "@/components/teralur/VisitReportForm";
import { formatTanggal } from "@/lib/dates";
import type { TimeRing } from "@/lib/cincin";
import type { ApiBoard } from "@/lib/api-contract";
import type { RecordProyek } from "@/components/teralur/proyek-view-data";

// Dossier proyek admin (T-45, Lampiran H.1): pita simulasi/data (menempel) →
// ChipStatus → nama paket → TabelPapanCatatan → Cincin + catatan →
// DaftarResource → Laporan warga (F-14) → tombol Buat Kartu Bukti →
// pernyataan batas (9.2) → footer atribusi (SiteFooter global).

// Pernyataan batas 9.2 — verbatim.
const BATAS_SIMULASI =
  "Halaman ini berisi data simulasi buatan tim Teralur untuk lomba. Bukan data resmi, dan tidak merujuk pada proyek, perusahaan, atau instansi nyata. Informasi papan dimasukkan pengelola dan tidak diverifikasi. Perbedaan tidak berarti kesalahan. Hubungi kami untuk koreksi atau klarifikasi.";
const BATAS_DATA_NYATA =
  "Informasi papan dimasukkan atau dikonfirmasi pengguna dan belum diverifikasi tim Teralur. Catatan resmi berasal dari data publik per {snapshot} dan mungkin belum memuat perubahan kontrak. Perbedaan tidak berarti kesalahan. Hubungi kami untuk koreksi atau klarifikasi.";

function formatRupiah(nilai: number | null | undefined): string | null {
  if (nilai === null || nilai === undefined || !Number.isFinite(nilai)) return null;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

export function DossierProyek({
  slug,
  status,
  demo,
  packageName,
  board,
  record,
  discrepancies,
  timeRing,
  resources,
  visitCounts,
}: {
  slug: string;
  status: DossierStatus;
  demo: boolean;
  packageName: string;
  board: ApiBoard | null;
  record: RecordProyek | null;
  discrepancies: SelisihProyek[];
  timeRing: TimeRing;
  resources: ResourcePublik[];
  visitCounts: { active: number; no_activity_seen: number; appears_complete: number };
}) {
  const tanggalData = record ? formatTanggal(record.snapshotDate) : null;

  // Baris H.3: tiga field kunci selalu; tujuh lain hanya bila terisi di salah
  // satu sisi. Sel null menampilkan "—" dengan label BELUM DIKETAHUI.
  const semuaBaris: BarisPapanCatatan[] = [
    {
      key: "packageName",
      label: "Nama paket",
      board: board?.packageName ?? null,
      record: record?.packageName ?? null,
      berbeda: discrepancies.some((item) => item.field === "packageName"),
    },
    {
      key: "supplier",
      label: "Penyedia",
      board: board?.supplier ?? null,
      record: record?.supplier ?? null,
      berbeda: discrepancies.some((item) => item.field === "supplier"),
    },
    {
      key: "contractValue",
      label: "Nilai kontrak",
      board: formatRupiah(board?.contractValue),
      record: formatRupiah(record?.contractValue ?? null),
      berbeda: discrepancies.some((item) => item.field === "contractValue"),
    },
    {
      key: "contractDate",
      label: "Tanggal kontrak",
      board: board?.contractDate ? formatTanggal(board.contractDate) : null,
      record: record?.contractDate ? formatTanggal(record.contractDate) : null,
    },
    {
      key: "durationDays",
      label: "Masa pelaksanaan",
      board: board?.durationDays ? `${board.durationDays} hari` : null,
      record: record?.durationDays ? `${record.durationDays} hari` : null,
    },
    {
      key: "fiscalYear",
      label: "Tahun anggaran",
      board: board?.fiscalYear === null || board?.fiscalYear === undefined ? null : String(board.fiscalYear),
      record: record?.fiscalYear === null || record?.fiscalYear === undefined ? null : String(record.fiscalYear),
    },
    {
      key: "fundingSource",
      label: "Sumber dana",
      board: board?.fundingSource ?? null,
      record: null,
    },
    {
      key: "agencyUnit",
      label: "Satuan kerja",
      board: board?.agencyUnit ?? null,
      record: record?.agencyUnit ?? null,
    },
    {
      key: "contractNumber",
      label: "Nomor kontrak",
      board: board?.contractNumber ?? null,
      record: null,
    },
    {
      key: "locationText",
      label: "Lokasi",
      board: board?.locationText ?? null,
      record: null,
    },
  ];
  const barisTampil = semuaBaris.filter((row, index) => {
    if (index < 3) return true; // tiga field kunci selalu tampil
    return row.board !== null || row.record !== null;
  });

  // Blok selisih (H.2/H.3): kedua nilai berdampingan, format sesuai field.
  const selisihTampil: SelisihProyek[] = discrepancies.map((item) =>
    item.field === "contractValue"
      ? {
          ...item,
          boardValue: formatRupiah(Number(item.boardValue)) ?? item.boardValue,
          recordValue: formatRupiah(Number(item.recordValue)) ?? item.recordValue,
        }
      : item,
  );

  return (
    <div className="flex-1">
      {demo ? (
        <PitaSimulasi />
      ) : tanggalData ? (
        <PitaData tanggal={tanggalData} />
      ) : null}
      <main className="mx-auto w-full max-w-[60rem] flex-1 px-4 py-6">
        <ChipStatus status={status} />
        <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight">
          {packageName}
        </h1>

        <div className="mt-6">
          <TabelPapanCatatan
            rows={barisTampil}
            selisih={selisihTampil}
            tanpaCatatanResmi={status === "tidak_ditemukan"}
          />
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="flex justify-center rounded-xl border-2 border-black bg-white p-5" aria-label="Cincin waktu">
            <CincinWaktu ring={timeRing} />
          </section>
          <PanelJejak
            judul="Jejak sumber"
            baris={[
              {
                label: "Sumber papan",
                nilai: "Data papan yang dimasukkan pengelola; belum diverifikasi tim.",
              },
              {
                label: "Sumber catatan resmi",
                nilai: record
                  ? demo
                    ? "Catatan resmi simulasi"
                    : "Opentender ICW (OCDS)"
                  : "Catatan resmi belum tersedia",
              },
              {
                label: "ID catatan resmi",
                nilai: record?.sourceId ?? "Belum diketahui",
              },
              { label: "Tanggal data", nilai: tanggalData ?? "Belum diketahui" },
              {
                label: "Rumus cincin",
                nilai:
                  "Hari ke-X dihitung dari tanggal hari ini (WIB) dikurangi tanggal mulai; bukan kemajuan fisik.",
              },
              { label: "Persen kemajuan fisik", nilai: "Belum diketahui" },
            ]}
          />
        </div>

        <div className="mt-8">
          <DaftarResource resources={resources} demo={demo} />
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-neutral-300 bg-white p-5">
            <h2 className="font-heading text-xl font-bold">Laporan warga</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Belum diverifikasi; jumlah saja, bukan ukuran kemajuan.{" "}
              <LabelTiga label="belum_diketahui" />
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              <li>Ada aktivitas pekerjaan: {visitCounts.active}</li>
              <li>Tidak terlihat aktivitas: {visitCounts.no_activity_seen}</li>
              <li>Tampak selesai: {visitCounts.appears_complete}</li>
            </ul>
            <div className="mt-4">
              <VisitReportForm dossierSlug={slug} />
            </div>
          </section>

          <section className="rounded-xl border border-neutral-300 bg-white p-5">
            <h2 className="font-heading text-xl font-bold">Kartu bukti</h2>
            <p className="mt-1 text-sm text-neutral-700">
              Ringkasan satu halaman untuk dibagikan, dengan pita simulasi bila
              data simulasi.
            </p>
            <Link
              href={`/evidence/${slug}`}
              className="mt-4 inline-flex min-h-11 items-center rounded-md border-2 border-black bg-kuning-papan px-4 py-2 font-semibold"
            >
              Buat Kartu Bukti
            </Link>
          </section>
        </div>

        <section className="mt-8 rounded-xl border border-neutral-300 bg-white p-5" aria-label="Batas informasi">
          <h2 className="font-heading text-lg font-bold">Batas informasi</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {demo
              ? BATAS_SIMULASI
              : BATAS_DATA_NYATA.replace("{snapshot}", tanggalData ?? "snapshot yang tersedia")}
          </p>
        </section>
      </main>
    </div>
  );
}
