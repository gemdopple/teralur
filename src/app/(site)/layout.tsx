import type { ReactNode } from "react";
import { SiteHeader } from "@/components/teralur/SiteHeader";
import { SiteFooter } from "@/components/teralur/SiteFooter";

export default function LayoutSitus({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
