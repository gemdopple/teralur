import type { Metadata } from "next";
import { SearchForm } from "@/components/teralur/SearchForm";

export const metadata: Metadata = { title: "Cari Paket | Teralur" };

export default function SearchPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">Catatan pengadaan</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Cari paket</h1>
      <p className="mt-3 max-w-3xl text-neutral-700">
        Cari berdasarkan nama paket atau penyedia. Hasil berasal dari snapshot data publik, bukan
        pembaruan real-time.
      </p>
      <div className="mt-7">
        <SearchForm />
      </div>
    </main>
  );
}
