"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { LabelTiga } from "@/components/teralur/LabelTiga";
import { kelasTombol } from "@/lib/kelas-tombol";
import { cn } from "@/lib/utils";

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
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-xl font-bold tracking-tight">
        {requiresSelection ? "Pilih catatan yang paling sesuai" : "Kandidat pembanding"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {requiresSelection
          ? "Dua kandidat memiliki skor berdekatan. Periksa keduanya sebelum memilih."
          : "Jika catatan teratas bukan proyek yang dimaksud, pilih kandidat lain."}
      </p>
      <div className="mt-4 grid gap-3">
        {candidates.map((candidate) => (
          <article
            key={candidate.id}
            className={cn(
              "rounded-xl border bg-card p-3.5 transition-all",
              candidate.selected ? "border-hitam-aspal shadow-sm" : "border-border",
            )}
          >
            <p className="font-semibold">{candidate.packageName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {candidate.supplier ?? "Penyedia belum diketahui"} · {rupiah(candidate.contractValue)}
            </p>
            <p className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
              Skor kemiripan: {(candidate.score * 100).toFixed(1)}%
              <LabelTiga label="hitungan" />
            </p>
            <button
              type="button"
              disabled={working || candidate.selected}
              onClick={() => void choose(candidate.id)}
              className={cn(kelasTombol(candidate.selected ? "outline" : "default"), "mt-3")}
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
