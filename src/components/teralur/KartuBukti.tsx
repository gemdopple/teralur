import Link from "next/link";
import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { LabelTiga } from "@/components/teralur/LabelTiga";
import { PitaSimulasi } from "@/components/teralur/PitaSimulasi";
import { formatTanggal } from "@/lib/dates";
import { RING_NOTE, type TimeRing } from "@/lib/cincin";

// Kartu bukti (T-25, Lampiran H.4): latar kertas, bingkai hitam, pita kuning
// di tepi atas. Isi: nama paket, ChipStatus, cincin ringkas (baris caption),
// label, tanggal data atau tulisan simulasi, pernyataan batas 9.2, atribusi,
// tautan balik ke dossier. Tanpa foto pengguna dan tanpa resource. Tanpa login.

// Pernyataan batas 9.2 — verbatim.
const BATAS_SIMULASI =
  "Halaman ini berisi data simulasi buatan tim Teralur untuk lomba. Bukan data resmi, dan tidak merujuk pada proyek, perusahaan, atau instansi nyata. Informasi papan dimasukkan pengelola dan tidak diverifikasi. Perbedaan tidak berarti kesalahan. Hubungi kami untuk koreksi atau klarifikasi.";
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
      {demo ? <PitaSimulasi /> : null}
      <main className="mx-auto w-full max-w-[60rem] flex-1 px-4 py-6">
        <div className="rounded-xl border-2 border-black bg-kertas">
          {/* Pita kuning di tepi atas kartu (8.3). */}
          <div className="h-3 rounded-t-[0.6rem] bg-kuning-papan" aria-hidden="true" />
          <div className="p-5 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">
              Kartu bukti
            </p>
            <h1 className="mt-2 break-words font-heading text-2xl font-extrabold leading-tight sm:text-3xl">
              {packageName}
            </h1>
            <div className="mt-4">
              <ChipStatus status={status} />
            </div>

            {/* Cincin ringkas: satu baris caption dengan labelnya. */}
            <div className="mt-5 rounded-lg border border-neutral-300 bg-white p-4">
              <p className="text-xs text-neutral-500">Cincin waktu</p>
              <p className="mt-1">
                <LabelTiga label={takTerhitung ? "belum_diketahui" : "hitungan"} />
              </p>
              <p className="mt-2 text-sm font-semibold">
                {takTerhitung ? "–" : timeRing.centerText} — {timeRing.caption}
              </p>
              <p className="mt-1 text-xs text-neutral-600">{RING_NOTE}</p>
            </div>

            <p className="mt-5 text-sm text-neutral-700">
              {demo
                ? "Tulisan simulasi: data di kartu ini dibuat tim untuk lomba."
                : tanggalData
                  ? `Tanggal data: ${tanggalData}.`
                  : "Tanggal data: belum diketahui."}
            </p>

            <section className="mt-5" aria-label="Pernyataan batas">
              <h2 className="font-heading text-lg font-bold">Pernyataan batas</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {demo
                  ? BATAS_SIMULASI
                  : BATAS_DATA_NYATA.replace(
                      "{snapshot}",
                      tanggalData ?? "snapshot yang tersedia",
                    )}
              </p>
            </section>

            <p className="mt-5 border-t border-black/15 pt-4 text-xs text-neutral-700">
              {demo
                ? "Sumber data: simulasi buatan tim Teralur (bukan data resmi). teralur · Transparansi Proyek Publik."
                : "Sumber data: catatan pengadaan terbuka OCDS, publikasi Opentender oleh ICW, lisensi ODbL. teralur · Transparansi Proyek Publik."}
            </p>
          </div>
        </div>

        <Link
          href={`/dossiers/${slug}`}
          className="mt-6 inline-flex min-h-11 items-center rounded-md border-2 border-black bg-white px-4 py-2 font-semibold"
        >
          ← Kembali ke dossier
        </Link>
      </main>
    </div>
  );
}
