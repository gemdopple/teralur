import type { ReactNode } from "react";
import { SiteHeader } from "@/components/teralur/SiteHeader";
import { SiteFooter } from "@/components/teralur/SiteFooter";
import { NavBawah } from "@/components/teralur/nav-bawah";
import { DepotPeta } from "@/components/teralur/DepotPeta";

export default function LayoutSitus({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Tautan lewati navigasi: tersembunyi sampai difokus dengan Tab. */}
      <a
        href="#isi-utama"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-hitam-aspal focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-kertas dark:focus:bg-brand dark:focus:text-hitam-aspal focus:outline-none focus-visible:ring-3 focus-visible:ring-kuning-papan"
      >
        Lewati ke isi utama
      </a>
      <SiteHeader />
      <main id="isi-utama" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      {/* Peta persisten: hidup di layout (di luar pohon rute) agar tidak pernah
          dibongkar/diaktifkan-ulang antar-navigasi — lihat catatan DepotPeta. */}
      <DepotPeta />
      {/* Ruang agar footer tidak tertutup nav bawah melayang di ponsel. */}
      <div aria-hidden className="h-20 md:hidden" />
      <NavBawah />
    </>
  );
}
