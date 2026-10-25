import Link from "next/link";
import { ChipStatus, TEKS_STATUS, type DossierStatus } from "@/components/teralur/ChipStatus";
import { LabelTiga } from "@/components/teralur/LabelTiga";
import { PitaData, PitaSimulasi } from "@/components/teralur/Pita";
import { TombolSalinBagikan } from "@/components/teralur/TombolSalinBagikan";
import { kelasTombol } from "@/lib/kelas-tombol";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { formatTanggal } from "@/lib/dates";
import { RING_NOTE, type TimeRing } from "@/lib/cincin";

// Kartu bukti (T-25, Lampiran H.4): kartu bersih rounded-3xl dengan pita kuning
// di tepi atas (8.3 "pita kuning" — pemakaian kuning yang sah) dan bayangan
// lembut. Isi: nama paket, ChipStatus, cincin ringkas (baris caption),
// label, tanggal data atau tulisan simulasi, pernyataan batas 9.2, atribusi,
// tautan balik ke dossier. Tanpa foto pengguna dan tanpa resource. Tanpa login.

// Pernyataan batas 9.2 — verbatim.
const BATAS_DATA_NYATA =
  "Informasi papan dimasukkan atau dikonfirmasi pengguna dan belum diverifikasi tim Teralur. Catatan resmi berasal dari data publik per {snapshot} dan mungkin belum memuat perubahan kontrak. Perbedaan tidak berarti kesalahan. Hubungi kami untuk koreksi atau klarifikasi.";

export function KartuBukti({
  slug,
  status,
  demo,
  packageName,
  timeRing,
  snapshotDate,
}: {
  slug: string;
  status: DossierStatus;
  demo: boolean;
  packageName: string;
  timeRing: TimeRing;
  snapshotDate: string | null;
}) {
  const tanggalData = snapshotDate ? formatTanggal(snapshotDate) : null;
  const takTerhitung = timeRing.state === "unknown";

  return (
    <div className="flex-1">
      {demo ? <PitaSimulasi /> : tanggalData ? <PitaData tanggal={tanggalData} /> : null}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            {/* Pita kuning di tepi atas kartu (8.3). */}
            <div aria-hidden className="h-1.5 bg-kuning-papan" />
            <div className="p-5 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Kartu bukti
              </p>
              <h1 className="mt-2 break-words font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {packageName}
              </h1>
              <div className="mt-4">
                <ChipStatus status={status} />
              </div>

              {/* Cincin ringkas: satu baris caption dengan labelnya. */}
              <div className="mt-5 rounded-2xl border border-border bg-background p-4">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Cincin waktu</p>
                <p className="mt-1">
                  <LabelTiga label={takTerhitung ? "belum_diketahui" : "hitungan"} />
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {takTerhitung ? "–" : timeRing.centerText} — {timeRing.caption}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{RING_NOTE}</p>
              </div>

              <p className="mt-5 text-sm text-muted-foreground">
                {tanggalData
                  ? `Tanggal data: ${tanggalData}.`
                  : "Tanggal data: belum diketahui."}
              </p>

              <section className="mt-5" aria-label="Pernyataan batas">
                <h2 className="font-heading text-lg font-bold tracking-tight">Pernyataan batas</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {BATAS_DATA_NYATA.replace(
                    "{snapshot}",
                    tanggalData ?? "snapshot yang tersedia",
                  )}
                </p>
              </section>

              <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                Sumber data: catatan pengadaan terbuka OCDS, publikasi Opentender oleh ICW,
                lisensi ODbL. teralur · Transparansi Proyek Publik.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 flex flex-wrap items-start gap-4">
          <Link href={`/dossiers/${slug}`} className={kelasTombol("outline")}>
            ← Kembali ke dossier
          </Link>
          <TombolSalinBagikan
            packageName={packageName}
            statusLabel={TEKS_STATUS[status]}
            ringCaption={timeRing.caption}
            ringNote={takTerhitung ? null : RING_NOTE}
            demo={demo}
            snapshotDate={snapshotDate}
            dossierPath={`/dossiers/${slug}`}
          />
        </div>
      </main>
    </div>
  );
}
