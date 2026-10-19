import type { Metadata } from "next";
import { ApiBoardForm } from "@/components/teralur/ApiBoardForm";

export const metadata: Metadata = { title: "Periksa Papan | Teralur" };

export default function CheckPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">Periksa proyek</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Periksa papan proyek</h1>
      <p className="mt-3 max-w-3xl text-neutral-700">
        Unggah foto untuk dibaca atau isi data secara manual. Foto tidak disimpan. Pencocokan hanya
        tersedia saat basis data resmi sudah dikonfigurasi.
      </p>
      <div className="mt-7">
        <ApiBoardForm />
      </div>
    </main>
  );
}
