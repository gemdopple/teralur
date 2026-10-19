"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { LabelTiga } from "@/components/teralur/LabelTiga";

const RESPONSE_SCHEMA = z.object({ status: z.string() });

export type CandidateChoice = {
  id: string;
  packageName: string;
  supplier: string | null;
  contractValue: number;
  score: number;
  selected: boolean;
};

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function CandidateSelector({
  slug,
  candidates,
  requiresSelection,
}: {
  slug: string;
  candidates: CandidateChoice[];
  requiresSelection: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  async function choose(recordId: string) {
    setWorking(true);
    setMessage("Memperbarui catatan pembanding…");
    try {
      const response = await fetch(`/api/dossiers/${slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recordId }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const error = z.object({ message: z.string().optional() }).safeParse(payload);
        throw new Error(error.success ? error.data.message ?? "Pilihan belum dapat disimpan." : "Pilihan belum dapat disimpan.");
      }
      if (!RESPONSE_SCHEMA.safeParse(payload).success) throw new Error("Respons pilihan tidak valid.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pilihan belum dapat disimpan.");
      setWorking(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-300 bg-white p-5">
      <h2 className="font-heading text-xl font-bold">
        {requiresSelection ? "Pilih catatan yang paling sesuai" : "Kandidat pembanding"}
      </h2>
      <p className="mt-1 text-sm text-neutral-700">
        {requiresSelection
          ? "Dua kandidat memiliki skor berdekatan. Periksa keduanya sebelum memilih."
          : "Jika catatan teratas bukan proyek yang dimaksud, pilih kandidat lain."}
      </p>
      <div className="mt-4 grid gap-3">
        {candidates.map((candidate) => (
          <article key={candidate.id} className="rounded-md border border-neutral-300 p-3">
            <p className="font-semibold">{candidate.packageName}</p>
            <p className="mt-1 text-sm text-neutral-700">
              {candidate.supplier ?? "Penyedia belum diketahui"} · {rupiah(candidate.contractValue)}
            </p>
            <p className="mt-1 flex items-center gap-2 font-mono text-xs text-neutral-600">
              Skor kemiripan: {(candidate.score * 100).toFixed(1)}%
              <LabelTiga label="hitungan" />
            </p>
            <button
              type="button"
              disabled={working || candidate.selected}
              onClick={() => void choose(candidate.id)}
              className="mt-3 rounded border border-black px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {candidate.selected ? "Catatan dipilih" : "Pilih catatan ini"}
            </button>
          </article>
        ))}
      </div>
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    </section>
  );
}
