import type { Metadata } from "next";
import { SearchForm } from "@/components/teralur/SearchForm";
import { Reveal } from "@/components/teralur/anim/Reveal";

export const metadata: Metadata = { title: "Cari Paket | Teralur" };

export default function SearchPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Reveal>
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-medium text-muted-foreground">
          <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
          Catatan pengadaan
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Cari paket</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Cari berdasarkan nama paket atau penyedia. Hasil berasal dari snapshot data publik, bukan
          pembaruan real-time.
        </p>
      </Reveal>
      <div className="mt-8">
        <SearchForm />
      </div>
    </main>
  );
}
