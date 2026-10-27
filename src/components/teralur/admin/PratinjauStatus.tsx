"use client";

import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { compare, type BoardLike, type KeyField } from "@/lib/compare";

// Pratinjau status (Lampiran L.3): menjalankan compare() yang SAMA dengan
// produksi (diimpor dari lib/compare.ts, bukan salinan) secara langsung saat
// mengetik. Murni — aman dirender di server maupun klien.

const LABEL_KOMPONEN: Record<KeyField, string> = {
  supplier: "Penyedia",
  packageName: "Nama paket",
  contractValue: "Nilai kontrak",
};

// Urutan komponen tetap sesuai compare() (F.3): penyedia, nama paket, nilai.
const URUTAN: KeyField[] = ["supplier", "packageName", "contractValue"];

const CHIP_STATUS: Record<"matched" | "discrepancy" | "not_found", DossierStatus> = {
  matched: "cocok",
  discrepancy: "selisih",
  not_found: "tidak_ditemukan",
};

function persenKemiripan(nilai: number): string {
  return `${Math.round(nilai * 100)}%`;
}

// Selisih nilai: 1 desimal, koma desimal Indonesia (mis. "4,1%").
function persenSelisih(nilai: number): string {
  return `${nilai.toFixed(1).replace(".", ",")}%`;
}

function teksKomponen(field: KeyField, pass: boolean, keterangan: string): string {
  return `${LABEL_KOMPONEN[field]}: ${pass ? "Lulus" : "Tidak lulus"} (${keterangan})`;
}

export function PratinjauStatus({
  board,
  record,
}: {
  board: BoardLike;
  /** null = belum menautkan catatan resmi registry — status jujur not_found. */
  record: BoardLike | null;
}) {
  const hasil = record
    ? compare(board, record)
    : { status: "not_found" as const, score: 0, components: [], discrepancies: [] };

  return (
    <section className="rounded-md border border-border bg-card p-4" aria-label="Pratinjau status">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-lg font-bold">Pratinjau status</h2>
        <ChipStatus status={CHIP_STATUS[hasil.status]} />
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {URUTAN.map((field) => {
          const komponen = hasil.components.find((c) => c.field === field);
          if (!komponen) {
            return <li key={field}>{LABEL_KOMPONEN[field]}: Tidak dibandingkan</li>;
          }
          if (field === "contractValue") {
            const selisih =
              typeof komponen.relativeDifference === "number" && Number.isFinite(komponen.relativeDifference)
                ? persenSelisih(komponen.relativeDifference * 100)
                : `${persenSelisih(0)}`;
            return <li key={field}>{teksKomponen(field, komponen.pass, `selisih ${selisih}`)}</li>;
          }
          return (
            <li key={field}>
              {teksKomponen(
                field,
                komponen.pass,
                `kemiripan ${persenKemiripan(komponen.similarity ?? 0)}`,
              )}
            </li>
          );
        })}
      </ul>
      {hasil.status === "not_found" && hasil.components.length < 2 ? (
        <p className="mt-2 text-sm text-neutral-700">
          Isi penyedia dan nilai kontrak di kedua sisi agar bisa dibandingkan.
        </p>
      ) : null}
    </section>
  );
}
