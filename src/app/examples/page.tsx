import type { Metadata } from "next";
import Link from "next/link";
import { EXAMPLE_DOSSIERS } from "@/data/examples";
import { ChipStatus } from "@/components/teralur/ChipStatus";
import { formatRupiahContoh } from "@/data/examples-format";

export const metadata: Metadata = { title: "Contoh Kasus | Teralur" };

export default function ExamplesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">
        Kasus contoh · SIMULASI, BUKAN DATA RESMI
      </p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Contoh kasus</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-700">
        Tiga kasus contoh dengan data rekaan yang dibuat untuk memperkenalkan alur Teralur
        tanpa menunjuk proyek atau penyedia nyata. Halaman ini berjalan dari data tersimpan
        sehingga tetap terbuka tanpa koneksi ke API. Galeri kasus nyata yang sudah diverifikasi
        tim menyusul.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLE_DOSSIERS.map((contoh) => (
          <Link
            key={contoh.exampleId}
            href={`/examples/${contoh.exampleId}`}
            className="block rounded-xl border-2 border-black bg-white p-4 transition hover:bg-[#F5F5F5]"
          >
            <ChipStatus status={contoh.status} />
            <p className="mt-3 font-semibold leading-snug">{contoh.judul}</p>
            <p className="mt-2 text-sm text-neutral-700">
              {contoh.record ? formatRupiahContoh(contoh.record.nilai_kontrak) : "Nilai tidak ditemukan di catatan"}
            </p>
            <p className="mt-2 text-xs text-neutral-600">{contoh.ringkasanVerifikasi}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
