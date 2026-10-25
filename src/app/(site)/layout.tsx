import type { ReactNode } from "react";
import { SiteHeader } from "@/components/teralur/SiteHeader";
import { SiteFooter } from "@/components/teralur/SiteFooter";
import { NavBawah } from "@/components/teralur/nav-bawah";

export default function LayoutSitus({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      {/* Ruang agar footer tidak tertutup nav bawah melayang di ponsel. */}
      <div aria-hidden className="h-20 md:hidden" />
      <NavBawah />
    </>
  );
}
