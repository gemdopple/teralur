import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { SearchRemoveIcon } from "@hugeicons/core-free-icons";
import { kelasTombol } from "@/lib/kelas-tombol";
import { Reveal } from "@/components/teralur/anim/Reveal";

// Halaman pesan netral (H.1 / 8.4 "Proyek tidak tersedia"): slug belum
// ditemukan, proyek draf, dinonaktifkan, atau sedang ditinjau. Bukan galat teknis.
// Next.js menyuntik <meta name="robots" content="noindex"> untuk not-found.
export default function DossierNotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <Reveal>
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-kuning-papan/15">
            <HugeiconsIcon icon={SearchRemoveIcon} className="size-7 text-foreground" />
          </span>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Dossier proyek
          </p>
          <h1 className="mx-auto mt-2 max-w-lg text-balance font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Proyek tidak ditemukan atau sedang ditinjau. Coba Cari Paket.
          </h1>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/search" className={kelasTombol("default", "lg")}>
              Cari Paket
            </Link>
            <Link href="/methodology" className={kelasTombol("outline", "lg")}>
              Metodologi
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
