"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { kelasTombol } from "@/lib/kelas-tombol";

export type ItemNavPublik = { href: string; label: string };

function aktif(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TautanNav({ items }: { items: ItemNavPublik[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={aktif(pathname, item.href) ? "page" : undefined}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
            aktif(pathname, item.href)
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function MenuPonsel({ items }: { items: ItemNavPublik[] }) {
  const pathname = usePathname();
  const [terbuka, setTerbuka] = useState(false);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label={terbuka ? "Tutup menu" : "Buka menu"}
        aria-expanded={terbuka}
        onClick={() => setTerbuka((nilai) => !nilai)}
        className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
      >
        <HugeiconsIcon icon={terbuka ? Cancel01Icon : Menu01Icon} className="size-4.5" />
      </button>
      {terbuka && (
        <nav
          aria-label="Navigasi ponsel"
          className="absolute top-11 right-0 z-50 w-64 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-hitam-aspal/10"
        >
          <div className="divide-y divide-border">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setTerbuka(false)}
                aria-current={aktif(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-sm font-medium",
                  aktif(pathname, item.href) ? "bg-accent text-foreground" : "hover:bg-accent",
                )}
              >
                {item.label}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
          <div className="p-3">
            <Link
              href="/login"
              onClick={() => setTerbuka(false)}
              className={`${kelasTombol()} w-full`}
            >
              Masuk ke dasbor
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
