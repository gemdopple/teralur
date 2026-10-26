import Link from "next/link";
import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { CandidateSelector, type CandidateChoice } from "@/components/teralur/CandidateSelector";
import { LabelTiga } from "@/components/teralur/LabelTiga";
import { PanelJejak } from "@/components/teralur/PanelJejak";
import { PapanCatatanSection, type BarisTabel } from "@/components/teralur/PapanCatatanSection";
import { VisitReportForm } from "@/components/teralur/VisitReportForm";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { kelasTombol } from "@/lib/kelas-tombol";
import { hitungCincin, inputCincin } from "@/lib/cincin";
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
  // Presedensi fallback §6.5 dihitung oleh fungsi murni inputCincin (T-18).
  const { masaHari, tanggalMulai } = inputCincin(
    board ? { durationDays: board.durationDays, contractDate: board.contractDate } : null,
    record,
  );
  const ring = hitungCincin({ masaHari, tanggalMulai, hariIni: new Date() });
  const rumusCincin =
    ring.keadaan === "tak_terhitung"
      ? "Cincin tidak dapat dihitung karena tanggal mulai atau masa kontrak tidak tersedia."
      : `Hari ke-${ring.berjalan} dihitung dari tanggal hari ini dikurangi tanggal mulai kontrak (${formatDate(tanggalMulai)}). Isian cincin = hari berjalan dibagi masa kontrak (${masaHari} hari), maksimum penuh.`;
  const rumusLangsung = "Nilai dibaca langsung dari sumbernya, bukan hasil hitungan.";
  const adaSelisihNilai =
    board?.contractValue != null && record != null && board.contractValue !== Number(record.nilai_kontrak);
  const rumusSelisihNilai = adaSelisihNilai
    ? "Selisih nilai = nilai di papan dikurangi nilai di catatan resmi. Perbedaan sering wajar karena addendum atau perubahan kontrak."
    : rumusLangsung;
  const rows: BarisTabel[] = [
    {
      key: "nama_paket",
      label: "Nama paket",
      board: board?.packageName ?? null,
      record: record?.nama_paket ?? null,
      rumus: rumusLangsung,
    },
    {
      key: "penyedia",
      label: "Penyedia",
      board: board?.supplier ?? null,
      record: record?.penyedia ?? null,
      rumus: rumusLangsung,
    },
    {
      key: "nilai_kontrak",
      label: "Nilai kontrak",
      board: board?.contractValue === null || board?.contractValue === undefined ? null : formatRupiah(board.contractValue),
      record: record ? formatRupiah(Number(record.nilai_kontrak)) : null,
      rumus: rumusSelisihNilai,
    },
    {
      key: "tanggal_kontrak",
      label: "Tanggal kontrak",
      board: board?.contractDate ? formatDate(board.contractDate) : null,
      record: record?.tanggal_kontrak ? formatDate(record.tanggal_kontrak) : null,
      rumus: rumusLangsung,
    },
    {
      key: "masa_hari",
      label: "Masa pelaksanaan",
      board: board?.durationDays ? `${board.durationDays} hari kalender` : null,
      record: record?.masa_hari ? `${record.masa_hari} hari kalender` : null,
      rumus: rumusLangsung,
    },
    {
      key: "tahun",
      label: "Tahun anggaran",
      board: board?.fiscalYear === null || board?.fiscalYear === undefined ? null : String(board.fiscalYear),
      record: record?.tahun === null || record?.tahun === undefined ? null : String(record.tahun),
      rumus: rumusLangsung,
    },
    {
      key: "sumber_dana",
      label: "Sumber dana",
      board: board?.fundingSource ?? null,
      record: null,
      rumus: rumusLangsung,
    },
    {
      key: "satuan_kerja",
      label: "Satuan kerja",
      board: board?.agencyUnit ?? null,
      record: record?.satuan_kerja ?? null,
      rumus: rumusLangsung,
    },
    {
      key: "nomor_kontrak",
      label: "Nomor kontrak",
      board: board?.contractNumber ?? null,
      record: null,
      rumus: rumusLangsung,
    },
    {
      key: "lokasi",
      label: "Lokasi",
      board: board?.locationText ?? null,
      record: null,
      rumus: rumusLangsung,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {evidenceOnly ? "Kartu bukti" : "Dossier proyek"}
            </p>
            <h1 className="mt-2 break-words font-heading text-3xl font-bold tracking-tight">
              {record?.nama_paket ?? board?.packageName ?? "Nama paket belum diketahui"}
            </h1>
          </div>
          <ChipStatus status={status} />
        </div>

        {simulasi ? (
          <>
            <p className="mt-4 inline-flex rounded-full bg-hitam-aspal px-3.5 py-1.5 text-sm font-semibold text-kuning-papan">
              Kasus contoh untuk memperkenalkan alur Teralur.
            </p>
            {record && (
              <p className="mt-2 text-sm text-muted-foreground">
                Data resmi per {formatDate(record.snapshot_tanggal)}. Bukan data real-time.
              </p>
            )}
          </>
        ) : (
          record && (
            <p className="mt-4 inline-flex rounded-full bg-kuning-papan px-3.5 py-1.5 text-sm font-semibold text-hitam-aspal">
              Data resmi per {formatDate(record.snapshot_tanggal)}. Bukan data real-time.
            </p>
          )
        )}
      </Reveal>

      <PapanCatatanSection
        rows={rows}
        ring={ring}
        ringRumus={rumusCincin}
        recordId={record?.id_sumber ?? null}
        snapshotTanggal={record ? formatDate(record.snapshot_tanggal) : null}
        catatanResmi={status === "catatan_resmi"}
        statusSelisih={status === "selisih"}
        selisihCatatan={
          <p className="mt-3 rounded-xl border border-selisih/60 bg-selisih/10 p-3 text-sm">
            Perbedaan sering wajar, misalnya karena addendum atau perubahan kontrak. Perlu klarifikasi.{" "}
            <LabelTiga label="belum_diketahui" />
          </p>
        }
      />

      <Reveal>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <PanelJejak
            judul="Jejak sumber"
            baris={[
              { label: "Sumber papan", nilai: board ? "Isian pengguna dari foto atau input manual; belum diverifikasi tim." : "Papan tidak tersedia untuk dibandingkan." },
              { label: "ID catatan resmi", nilai: record?.id_sumber ?? "Belum diketahui" },
              { label: "Sumber data", nilai: record?.sumber ?? "Catatan resmi belum tersedia" },
              { label: "Tanggal snapshot", nilai: record ? formatDate(record.snapshot_tanggal) : "Belum diketahui" },
              { label: "Rumus cincin", nilai: "Hari berjalan dibagi masa pelaksanaan; bukan persen kemajuan fisik." },
            ]}
          />
          {!evidenceOnly && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="font-heading text-xl font-bold tracking-tight">Laporan warga</h2>
              <p className="mt-1 text-sm text-muted-foreground">
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
      </Reveal>

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
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-xl font-bold tracking-tight">Batas informasi</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Informasi papan dikonfirmasi oleh pengguna dan belum diverifikasi tim Teralur. Catatan resmi
              berasal dari data publik per {record ? formatDate(record.snapshot_tanggal) : "tanggal snapshot yang tersedia"}
              {" "}dan mungkin belum memuat perubahan kontrak. Perbedaan tidak berarti kesalahan.
            </p>
            <Link href={`/evidence/${slug}`} className={kelasTombol("default", "lg") + " mt-4"}>
              Buat kartu bukti
            </Link>
          </section>
        </div>
      )}
      {evidenceOnly && (
        <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
          Informasi papan dikonfirmasi pengguna dan belum diverifikasi tim Teralur. Perbedaan tidak berarti kesalahan.
          Sumber data publik: OCDS (Opentender/ICW), lisensi ODbL.
        </p>
      )}
    </main>
  );
}
