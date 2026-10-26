import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiBoardForm } from "@/components/teralur/ApiBoardForm";
import { photoFlowEnabled } from "@/lib/flags";

export const metadata: Metadata = { title: "Periksa Papan | Teralur" };

// T-38: flag dibaca saat build. Dengan PHOTO_FLOW_ENABLED=false, notFound()
// terpanggil saat prerender sehingga rute ini menjadi halaman statis yang
// melayani HTTP 404 sungguhan (dokumen Next: "A page that reaches notFound()
// during prerendering can remain Static and serve a 404"). Perubahan env
// memerlukan build ulang; di Vercel perubahan env memicu deploy baru.
export default function CheckPage() {
  if (!photoFlowEnabled()) {
    notFound();
  }

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
