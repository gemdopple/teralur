"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";

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
      <form onSubmit={search} className="grid gap-3 rounded-xl border-2 border-black bg-white p-5 sm:grid-cols-[1fr_10rem_auto]">
        <label>
          <span className="sr-only">Nama paket atau penyedia</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nama paket atau penyedia"
            maxLength={120}
            className="w-full rounded-md border border-neutral-400 px-3 py-3"
          />
        </label>
        <label>
          <span className="sr-only">Tahun anggaran (opsional)</span>
          <input
            inputMode="numeric"
            value={year}
            onChange={(event) => setYear(event.target.value.replace(/[^\d]/g, ""))}
            placeholder="Tahun (opsional)"
            maxLength={4}
            className="w-full rounded-md border border-neutral-400 px-3 py-3"
          />
        </label>
        <button
          type="submit"
          disabled={working}
          className="rounded-md border-2 border-black bg-[#FFC400] px-5 py-3 font-bold disabled:opacity-50"
        >
          {working ? "Mencari…" : "Cari"}
        </button>
      </form>
      {message && <p role="status" className="mt-4 rounded-md bg-white p-4 text-sm">{message}</p>}
      <div className="mt-4 grid gap-3">
        {results.map((result) => (
          <article key={result.id} className="flex flex-col gap-3 rounded-xl border border-black/20 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">{result.packageName}</h2>
              <p className="mt-1 text-sm text-neutral-700">
                {result.supplier ?? "Penyedia belum diketahui"} · {result.fiscalYear ?? "Tahun tidak tersedia"}
              </p>
              <p className="mt-1 font-mono text-sm">{rupiah(result.contractValue)}</p>
            </div>
            <button
              type="button"
              disabled={working}
              onClick={() => void openRecord(result.id)}
              className="rounded-md border border-black px-4 py-2 text-sm font-semibold hover:bg-[#FFC400] disabled:opacity-50"
            >
              Lihat catatan resmi
            </button>
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm text-neutral-700">
        <Link href="/methodology" className="underline underline-offset-4">Cara kerja pencarian dan batas data</Link>
      </p>
    </>
  );
}
