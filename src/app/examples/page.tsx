import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contoh Kasus | Teralur" };

export default function ExamplesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">Data terverifikasi</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Contoh kasus</h1>
      <div className="mt-6 rounded-xl border-2 border-dashed border-neutral-400 bg-white p-6">
        <p className="font-semibold">Belum ada contoh yang dipublikasikan.</p>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Galeri hanya akan menampilkan kasus yang telah diperiksa tim. Tidak ada data simulasi atau
          contoh rekaan yang ditampilkan sebagai proyek nyata.
        </p>
      </div>
    </main>
  );
}
