import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { PemindaiQr } from "@/components/teralur/PemindaiQr";

// Halaman pindai khusus (ponsel): tanpa navigasi situs agar fokus ke kamera.
// Kamera menyala otomatis begitu halaman terbuka; setelah QR terbaca, pengguna
// langsung dibawa ke dossier proyek. Kembali ke /jelajah lewat tautan atas.

export const metadata: Metadata = {
  title: "Pindai QR | Teralur",
  description: "Pindai QR pada papan proyek untuk membuka laporan lengkapnya.",
  robots: { index: false, follow: false },
};

export default function HalamanPindai() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-background">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Link
          href="/jelajah"
          aria-label="Kembali ke jelajah"
          className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4.5" />
        </Link>
        <div>
          <p className="font-heading text-sm font-bold leading-tight">Pindai QR</p>
          <p className="text-[11px] leading-tight text-muted-foreground">
            Arahkan kamera ke QR pada papan proyek
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <PemindaiQr mulaiOtomatis />
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          Kamera aktif hanya selama halaman ini terbuka. Gambar tidak pernah
          disimpan di mana pun.
        </p>
      </main>
    </div>
  );
}
