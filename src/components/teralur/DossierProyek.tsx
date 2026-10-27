import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";import { CincinWaktuAnim } from "@/components/teralur/cincin-anim";
import { DaftarResource, type ResourcePublik } from "@/components/teralur/DaftarResource";
import { GrafikAspek, type BarisAspek } from "@/components/teralur/grafik-aspek";
import { GrafikLaporan } from "@/components/teralur/grafik-laporan";
import { GrafikNilai } from "@/components/teralur/grafik-nilai";
import { LabelTiga } from "@/components/teralur/LabelTiga";
import { PitaData } from "@/components/teralur/Pita";
import { PanelJejak } from "@/components/teralur/PanelJejak";
import { VisitReportForm } from "@/components/teralur/VisitReportForm";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/teralur/anim/Stagger";
import {
  TabelPapanCatatan,
  type BarisPapanCatatan,
  type SelisihProyek,
} from "@/components/teralur/TabelPapanCatatan";
import { formatTanggal } from "@/lib/dates";
import { formatRupiah } from "@/lib/format-rupiah";
import { type TimeRing } from "@/lib/cincin";
import type { ApiBoard } from "@/lib/api-contract";
import type { RecordProyek } from "@/components/teralur/proyek-view-data";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link04Icon, Location01Icon, Building02Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// Dossier proyek admin (T-45, Lampiran H.1) — gaya kartu modern (bukan lembar
// spesifikasi). Urutan seksi: pita simulasi/data → header → [1] Rincian data
// (tabel H.3 ringkas) → [2] Grafik (cincin waktu, nilai kontrak, kecocokan per
// aspek, laporan warga) → [3] Jejak sumber + dokumen → [4] Dari mana data
// berasal → footer global.
//
// Seksi "Laporan warga & bagikan" dan "Batas informasi" dihapus atas permintaan
// PM (2026-10-27): formulir laporan/bagikan membingungkan di mode demo, dan
// batas informasi digantikan seksi "Dari mana data berasal" yang lebih
// konkret (dokumen sumber + tautan portal).

type KeadaanField = "cocok" | "selisih" | "kosong";

function keadaanField(
  field: BarisPapanCatatan["key"],
  board: ApiBoard | null,
  record: RecordProyek | null,
  discrepancies: SelisihProyek[],
): KeadaanField {
  if (discrepancies.some((item) => item.field === field)) return "selisih";
  const nilaiBoard =
    field === "contractValue"
      ? board?.contractValue
      : field === "packageName"
        ? board?.packageName
        : board?.supplier;
  const nilaiRecord =
    field === "contractValue"
      ? record?.contractValue
      : field === "packageName"
        ? record?.packageName
        : record?.supplier;
  if (
    nilaiBoard === null ||
    nilaiBoard === undefined ||
    nilaiRecord === null ||
    nilaiRecord === undefined
  ) {
    return "kosong";
  }
  return "cocok";
}

function kalimatField(field: BarisPapanCatatan["key"], keadaan: KeadaanField): string {
  switch (field) {
    case "packageName":
      return keadaan === "cocok"
        ? "Nama paket di papan sama dengan catatan resmi."
        : keadaan === "selisih"
          ? "Nama di papan berbeda dari catatan resmi — papan mungkin memakai nama singkat. Bandingkan keduanya pada rincian di bawah."
          : "Nama paket di papan belum terisi, sehingga belum dapat dibandingkan.";
    case "supplier":
      return keadaan === "cocok"
        ? "Penyedia di papan sama dengan catatan resmi."
        : keadaan === "selisih"
          ? "Nama penyedia di papan berbeda dari catatan resmi. Kontrak bisa berpindah penyedia lewat mekanisme resmi — periksa rinciannya."
          : "Nama penyedia di papan belum terisi, sehingga belum dapat dibandingkan.";
    case "contractValue":
      return keadaan === "cocok"
        ? "Nilai kontrak di papan sama dengan catatan resmi."
        : keadaan === "selisih"
          ? "Nilai di papan berbeda dari catatan resmi. Perubahan nilai dapat terjadi lewat addendum resmi — bandingkan keduanya pada rincian di bawah."
          : "Nilai kontrak di papan belum terisi, sehingga belum dapat dibandingkan.";
    default:
      return "Data belum dapat dibandingkan.";
  }
}

function PersenSelisih(dossier: {
  board: ApiBoard | null;
  record: RecordProyek | null;
}): number | null {
  const papan = dossier.board?.contractValue;
  const resmi = dossier.record?.contractValue;
  if (
    typeof papan !== "number" ||
    typeof resmi !== "number" ||
    !Number.isFinite(papan) ||
    !Number.isFinite(resmi) ||
    resmi <= 0
  ) {
    return null;
  }
  return (Math.abs(papan - resmi) / resmi) * 100;
}

function formatPersen(nilai: number): string {
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(nilai)}%`;
}

// Judul seksi dengan subteks kecil — pengganti indeks LabelSeksi lama.
function JudulSeksi({ children, subteks }: { children: string; subteks?: string }) {
  return (
    <div>
      <h2 className="font-heading text-xl font-semibold tracking-tight">{children}</h2>
      {subteks && <p className="mt-1 text-sm text-muted-foreground">{subteks}</p>}
    </div>
  );
}

// Baris dokumen sumber untuk "Dari mana data berasal" — lencana jenis
// dibulatkan (rounded-md), tautan terbuka di tab baru dengan rel aman.
function BarisDokumen({ label, url }: { label: string; url: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground"
      >
        WEB
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
          >
            {label}
            <HugeiconsIcon icon={Link04Icon} className="size-3.5 text-muted-foreground" />
          </a>
        </p>
        <p className="mt-0.5 break-all text-xs text-muted-foreground">{url}</p>
      </div>
    </li>
  );
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
  statis = false,
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
  /** Salinan statis (T-28 mode cadangan): tanpa form/laporan dan kartu bukti daring. */
  statis?: boolean;
}) {
  const tanggalData = record ? formatTanggal(record.snapshotDate) : null;

  // Baris H.3: tiga field kunci selalu; tujuh lain hanya bila terisi di salah
  // satu sisi. Sel null menampilkan "—" dengan keadaan belum diketahui.
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

  const persenSelisih = PersenSelisih({ board, record });
  const ringPersen = Math.round(Math.min(Math.max(timeRing.fillRatio, 0), 1) * 100);

  // Baris "Kecocokan per aspek" (GrafikAspek): keadaan per field kunci dari
  // logika keadaanField + kalimatField; persen selisih nilai dari PersenSelisih.
  const keadaanNama = keadaanField("packageName", board, record, discrepancies);
  const keadaanPenyedia = keadaanField("supplier", board, record, discrepancies);
  const keadaanNilai = keadaanField("contractValue", board, record, discrepancies);
  const barisAspek: BarisAspek[] = [
    {
      label: "Nama paket",
      state: keadaanNama,
      persen: keadaanNama === "selisih" ? 60 : undefined,
      kalimat: kalimatField("packageName", keadaanNama),
    },
    {
      label: "Penyedia",
      state: keadaanPenyedia,
      persen: keadaanPenyedia === "selisih" ? 60 : undefined,
      kalimat: kalimatField("supplier", keadaanPenyedia),
    },
    {
      label: "Nilai kontrak",
      state: keadaanNilai,
      persen:
        keadaanNilai === "selisih" ? (persenSelisih !== null ? Math.round(persenSelisih * 10) / 10 : 60) : undefined,
      kalimat: kalimatField("contractValue", keadaanNilai),
    },
  ];

  return (
    <div className="flex-1">
      {tanggalData ? <PitaData tanggal={tanggalData} /> : null}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Header */}
        <header>
          <ChipStatus status={status} />
          <h1 className="text-balance mt-4 max-w-4xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {packageName}
          </h1>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {board?.locationText && (
              <li className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Location01Icon} className="size-4" />
                {board.locationText}
              </li>
            )}
            {(board?.agencyUnit ?? record?.agencyUnit) && (
              <li className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Building02Icon} className="size-4" />
                {board?.agencyUnit ?? record?.agencyUnit}
              </li>
            )}
            {(board?.fiscalYear ?? record?.fiscalYear) && (
              <li className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
                Tahun anggaran {board?.fiscalYear ?? record?.fiscalYear}
              </li>
            )}
          </ul>
          {statis && (
            <p className="mt-3 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Salinan tersimpan (mode cadangan) — terbuka tanpa koneksi.
            </p>
          )}
        </header>

        {/* [1] Rincian data — tabel papan vs catatan resmi yang ringkas. */}
        <section aria-label="Rincian data" className="mt-10">
          <JudulSeksi subteks="Setiap baris memasangkan data papan dengan catatan resmi, lengkap dengan penanda selisihnya.">
            Rincian data
          </JudulSeksi>
          <Reveal className="mt-4">
            <TabelPapanCatatan
              rows={barisTampil}
              selisih={selisihTampil}
              tanpaCatatanResmi={status === "tidak_ditemukan"}
            />
          </Reveal>
        </section>

        {/* [2] Grafik — grid 2x2: cincin waktu, nilai kontrak, kecocokan per
            aspek, dan laporan warga. */}
        <section aria-label="Grafik" className="mt-12">
          <JudulSeksi>Grafik</JudulSeksi>
          <StaggerGroup className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* 1) Cincin waktu */}
            <StaggerItem className="min-w-0">
              <article className="h-full rounded-lg border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold">Waktu pelaksanaan</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Hitungan hari sejak kontrak, bukan kemajuan fisik.
                </p>
                <div className="mt-3 flex justify-center">
                  <CincinWaktuAnim ring={timeRing} />
                </div>
                {!(
                  timeRing.state === "unknown"
                ) && (
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                      <span>Progres waktu</span>
                      <span className="font-mono font-semibold text-foreground">{ringPersen}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          timeRing.state === "over" ? "bg-selisih" : "bg-hitam-aspal",
                        )}
                        style={{ width: `${ringPersen}%` }}
                      />
                    </div>
                  </div>
                )}
              </article>
            </StaggerItem>

            {/* 2) Grafik nilai */}
            <StaggerItem className="min-w-0">
              <article className="h-full rounded-lg border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold">Nilai kontrak</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Papan dibandingkan dengan catatan resmi.
                </p>
                <div className="mt-3">
                  <GrafikNilai papan={board?.contractValue ?? null} resmi={record?.contractValue ?? null} />
                </div>
                {persenSelisih !== null && persenSelisih > 0 && (
                  <p className="mt-2 rounded-md bg-selisih/10 px-3.5 py-2.5 text-xs leading-5 text-selisih-teks">
                    Selisih {formatPersen(persenSelisih)} dari catatan resmi.
                  </p>
                )}
              </article>
            </StaggerItem>

            {/* 3) Kecocokan per aspek */}
            <StaggerItem className="min-w-0">
              <article className="h-full rounded-lg border border-border bg-card p-5 shadow-sm">
                <h3 className="text-sm font-semibold">Kecocokan per aspek</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Bacalah perbandingan ini sebagai pertanyaan, bukan vonis.
                </p>
                <div className="mt-4">
                  <GrafikAspek baris={barisAspek} />
                </div>
                {status === "tidak_ditemukan" && (
                  <p className="mt-4 rounded-md bg-muted/60 px-3.5 py-2.5 text-xs leading-5 text-muted-foreground">
                    Catatan resmi untuk proyek ini belum ditemukan dalam data yang kami miliki.
                  </p>
                )}
              </article>
            </StaggerItem>

            {/* 4) Laporan warga (donat) */}
            <StaggerItem className="min-w-0">
              <article className="h-full rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Laporan warga</h3>
                  <LabelTiga label="hitungan" />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Laporan warga, belum diverifikasi. Jumlah laporan per keadaan — bukan ukuran
                  kemajuan.
                </p>
                <div className="mt-4">
                  <GrafikLaporan
                    aktif={visitCounts.active}
                    sepi={visitCounts.no_activity_seen}
                    selesai={visitCounts.appears_complete}
                  />
                </div>
              </article>
            </StaggerItem>
          </StaggerGroup>
        </section>

        {/* [3] Jejak sumber + dokumen */}
        <section aria-label="Jejak sumber dan dokumen" className="mt-12">
          <JudulSeksi>Jejak sumber &amp; dokumen</JudulSeksi>
          <StaggerGroup className="mt-4 grid gap-4">
            <StaggerItem className="min-w-0">
              {/* Judul panel tidak ditampilkan di konteks ini agar tidak dobel
                  dengan judul seksi; panel tetap bertajuk lewat aria-label. */}
              <div className="[&_h3]:hidden">
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
                        ? "Opentender ICW (OCDS)"
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
            </StaggerItem>
          </StaggerGroup>

          {/* Dokumen unggahan pengelola (F-16) — tetap bagian dari jejak sumber
              + dokumen; kosong pada proyek demo (DaftarResource return null). */}
          <Reveal className="mt-4">
            <DaftarResource resources={resources} demo={demo} />
          </Reveal>
        </section>

        {/* [4] Dari mana data berasal — menggantikan "Batas informasi" dan
            memindahkan dokumen sumber keluar dari jejak sumber (permintaan PM
            2026-10-27). */}
        <Reveal>
          <section
            aria-label="Dari mana data berasal"
            className="mt-12 rounded-lg border border-border bg-muted/40 p-5"
          >
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Dari mana data berasal
            </h2>
            {demo ? (
              <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
                Dokumen sumber: nomor kontrak {board?.contractNumber ?? "Belum diketahui"} —
                salinan tersimpan pada arsip pengelola.
              </p>
            ) : (
              <>
                <ul className="mt-3 max-w-prose space-y-3">
                  <BarisDokumen
                    label="Opentender ICW — portal data pengadaan"
                    url="https://opentender.net"
                  />
                  <BarisDokumen
                    label="Dokumentasi standar OCDS"
                    url="https://standard.open-contracting.org"
                  />
                </ul>
                <p className="mt-4 max-w-prose border-t border-border pt-3 text-sm leading-6 text-muted-foreground">
                  {tanggalData
                    ? `Catatan resmi diambil dari snapshot data per ${tanggalData}.`
                    : "Catatan resmi belum tersedia untuk proyek ini."}
                </p>
              </>
            )}
          </section>
        </Reveal>

        {/* Laporan warga (anti-massa: PoW + honeypot, lihat VisitReportForm):
            warga tanpa akun melaporkan kondisi lapangan sebagai pemeriksa
            silang terhadap data papan dan catatan resmi. Tidak ada pada
            salinan statis (T-28). */}
        {!statis && (
          <Reveal>
            <div className="mx-auto mt-12 w-full max-w-2xl">
              <VisitReportForm dossierSlug={slug} />
            </div>
          </Reveal>
        )}
      </main>
    </div>
  );
}
