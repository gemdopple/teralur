"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { kelasTombol } from "@/lib/kelas-tombol";
import { cn } from "@/lib/utils";

const RESULT_SCHEMA = z.object({
  id: z.string().uuid(),
  packageName: z.string(),
  supplier: z.string().nullable(),
  contractValue: z.number(),
  fiscalYear: z.number().nullable(),
  agencyUnit: z.string().nullable(),
  snapshotDate: z.string(),
});
const RESPONSE_SCHEMA = z.object({ results: z.array(RESULT_SCHEMA) });
const CREATE_SCHEMA = z.object({ slug: z.string() });
type SearchResult = z.infer<typeof RESULT_SCHEMA>;

function rupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      setMessage("Masukkan nama paket atau penyedia.");
      return;
    }
    setWorking(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ q: query.trim() });
      if (year) params.set("year", year);
      const response = await fetch(`/api/search?${params.toString()}`);
      const payload: unknown = await response.json();
      if (!response.ok) {
        const error = z.object({ message: z.string().optional() }).safeParse(payload);
        throw new Error(error.success ? error.data.message ?? "Pencarian belum tersedia." : "Pencarian belum tersedia.");
      }
      const parsed = RESPONSE_SCHEMA.safeParse(payload);
      if (!parsed.success) throw new Error("Respons pencarian tidak valid.");
      setResults(parsed.data.results);
      setMessage(
        parsed.data.results.length === 0
          ? "Tidak ditemukan di data yang kami miliki. Coba kata kunci lain."
          : `${parsed.data.results.length} hasil ditemukan.`,
      );
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? error.message : "Pencarian belum dapat dilakukan.");
    } finally {
      setWorking(false);
    }
  }

  async function openRecord(recordId: string) {
    setWorking(true);
    setMessage("Membuka dossier catatan resmi…");
    try {
      const response = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recordId }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const error = z.object({ message: z.string().optional() }).safeParse(payload);
        throw new Error(error.success ? error.data.message ?? "Dossier belum dapat dibuat." : "Dossier belum dapat dibuat.");
      }
      const parsed = CREATE_SCHEMA.safeParse(payload);
      if (!parsed.success) throw new Error("Respons dossier tidak valid.");
      router.push(`/dossiers/${parsed.data.slug}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dossier belum dapat dibuat.");
      setWorking(false);
    }
  }

  return (
    <>
      {/* Kartu formulir: tidak dianimasikan (internal formulir tetap statis). */}
      <form
        onSubmit={search}
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-[1fr_10rem_auto] sm:items-end sm:p-6"
      >
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Nama paket atau penyedia</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nama paket atau penyedia"
            maxLength={120}
            className="h-11 w-full rounded-xl border border-border bg-card px-3.5 text-sm outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Tahun anggaran (opsional)</span>
          <input
            inputMode="numeric"
            value={year}
            onChange={(event) => setYear(event.target.value.replace(/[^\d]/g, ""))}
            placeholder="Tahun (opsional)"
            maxLength={4}
            className="h-11 w-full rounded-xl border border-border bg-card px-3.5 font-mono text-sm outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
        </label>
        <button type="submit" disabled={working} className={cn(kelasTombol("default", "lg"), "sm:justify-self-start")}>
          {working ? "Mencari…" : "Cari"}
        </button>
      </form>
      {message && (
        <p role="status" className="animate-fade-in mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
          {message}
        </p>
      )}
      <div className="mt-4 grid gap-3">
        {results.map((result, index) => (
          <article
            key={result.id}
            style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
            className="animate-fade-up flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div>
              <h2 className="font-semibold">{result.packageName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.supplier ?? "Penyedia belum diketahui"} · {result.fiscalYear ?? "Tahun tidak tersedia"}
              </p>
              <p className="mt-1 font-mono text-sm">{rupiah(result.contractValue)}</p>
            </div>
            <button
              type="button"
              disabled={working}
              onClick={() => void openRecord(result.id)}
              className={kelasTombol("outline")}
            >
              Lihat catatan resmi
            </button>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/methodology" className="underline underline-offset-4">Cara kerja pencarian dan batas data</Link>
      </p>
    </>
  );
}
