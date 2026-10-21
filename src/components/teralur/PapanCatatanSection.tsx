"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Cincin } from "@/components/teralur/Cincin";
import { LabelTiga } from "@/components/teralur/LabelTiga";
import { PanelJejak } from "@/components/teralur/PanelJejak";
import type { Cincin as DataCincin } from "@/lib/cincin";

export type BarisTabel = {
  key: string;
  label: string;
  board: string | null;
  record: string | null;
  rumus: string;
};

export type PapanCatatanProps = {
  rows: BarisTabel[];
  ring: DataCincin;
  ringRumus: string;
  recordId: string | null;
  snapshotTanggal: string | null;
  catatanResmi: boolean;
  statusSelisih: boolean;
  selisihCatatan: ReactNode;
};

// F-08: satu ketukan pada field (atau cincin) membuka panel jejak — laci dari
// bawah di ponsel, panel samping di desktop.
export function PapanCatatanSection({
  rows,
  ring,
  ringRumus,
  recordId,
  snapshotTanggal,
  catatanResmi,
  statusSelisih,
  selisihCatatan,
}: PapanCatatanProps) {
  const [terpilih, setTerpilih] = useState<{ judul: string; rumus: string; adaPapan: boolean; adaCatatan: boolean } | null>(null);

  useEffect(() => {
    if (!terpilih) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTerpilih(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [terpilih]);

  return (
    <section className="mt-6 grid gap-6 rounded-xl border-2 border-black bg-white p-5 md:grid-cols-[1fr_13rem]">
      <div>
        <h2 className="font-heading text-xl font-bold">Papan dan catatan resmi</h2>
        {catatanResmi && (
          <p className="mt-2 text-sm text-neutral-700">
            Tidak ada papan untuk dibandingkan. Informasi berikut berasal dari catatan resmi.
          </p>
        )}
        <div className="mt-4 divide-y divide-neutral-200">
          {rows.map((row) => (
            <button
              key={row.key}
              type="button"
              onClick={() =>
                setTerpilih({
                  judul: row.label,
                  rumus: row.rumus,
                  adaPapan: row.board !== null,
                  adaCatatan: row.record !== null,
                })
              }
              className="grid w-full gap-3 py-3 text-left sm:grid-cols-[1fr_1fr_1fr]"
            >
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
            </button>
          ))}
        </div>
        {statusSelisih && selisihCatatan}
      </div>
      <div className="flex items-center justify-center border-t border-neutral-200 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
        <div>
          <Cincin data={ring} />
          <button
            type="button"
            onClick={() =>
              setTerpilih({
                judul: "Cincin waktu",
                rumus: ringRumus,
                adaPapan: ring.keadaan !== "tak_terhitung",
                adaCatatan: recordId !== null,
              })
            }
            className="mt-3 rounded-md border border-neutral-400 px-3 py-1.5 text-sm font-medium"
          >
            Lihat jejak cincin
          </button>
        </div>
      </div>

      {terpilih && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Jejak sumber: ${terpilih.judul}`}>
          <button
            type="button"
            aria-label="Tutup panel jejak"
            onClick={() => setTerpilih(null)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t-2 border-black bg-white p-5 md:inset-y-0 md:left-auto md:right-0 md:w-[26rem] md:max-h-none md:rounded-none md:border-t-0 md:border-l-2">
            <PanelJejak
              judul={`Jejak sumber: ${terpilih.judul}`}
              baris={[
                {
                  label: "Sumber",
                  nilai: [
                    terpilih.adaPapan ? "Papan proyek, dikonfirmasi pengguna dari foto; belum diverifikasi tim." : null,
                    terpilih.adaCatatan ? "Catatan resmi (pengadaan terbuka)." : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Belum ada sumber untuk field ini.",
                },
                { label: "Tanggal snapshot", nilai: snapshotTanggal ?? "Belum diketahui" },
                { label: "Rumus", nilai: terpilih.rumus },
                {
                  label: "Batas",
                  nilai:
                    "Isian papan dikonfirmasi pengguna dan belum diverifikasi tim Teralur. Catatan resmi mungkin belum memuat perubahan kontrak. Perbedaan tidak berarti kesalahan.",
                },
              ]}
            />
            <div className="mt-4">
              <p className="text-sm text-neutral-600">ID catatan resmi</p>
              <TombolSalin teks={recordId ?? "Belum diketahui"} dinonaktifkan={recordId === null} />
            </div>
            <button
              type="button"
              onClick={() => setTerpilih(null)}
              className="mt-5 rounded-md border-2 border-black px-4 py-2 text-sm font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function TombolSalin({ teks, dinonaktifkan }: { teks: string; dinonaktifkan: boolean }) {
  const [status, setStatus] = useState("");
  const salin = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(teks);
      setStatus("Tersalin.");
    } catch {
      // Fallback untuk peramban tanpa Clipboard API: pilih teks agar mudah disalin manual.
      const elemen = document.getElementById("id-catatan-resmi");
      const selection = window.getSelection();
      if (elemen && selection) {
        const range = document.createRange();
        range.selectNodeContents(elemen);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setStatus("Teks terpilih; salin manual bila perlu.");
    }
  }, [teks]);

  return (
    <div className="mt-1 flex items-center gap-3">
      <code id="id-catatan-resmi" className="break-all rounded border border-neutral-300 bg-neutral-50 px-2 py-1 font-mono text-sm">
        {teks}
      </code>
      <button
        type="button"
        onClick={salin}
        disabled={dinonaktifkan}
        className="rounded-md border border-neutral-500 px-3 py-1 text-sm font-medium disabled:opacity-50"
      >
        Salin ID
      </button>
      {status && <span role="status" className="text-sm text-neutral-700">{status}</span>}
    </div>
  );
}
