"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type ItemNavPublik = { href: string; label: string };

function aktif(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Label pendek untuk baris nav di lebar menengah, agar tautan tetap muat
// tanpa memaksa header meluber (768px tadinya meluber 20px).
const LABEL_PENDEK: Record<string, string> = {
  "/": "Beranda",
  "/jelajah": "Jelajah",
  "/check": "Periksa",
  "/examples": "Contoh",
  "/methodology": "Metodologi",
  "/about": "Tentang",
};

// Lebar menengah (md–lg) memakai label pendek; lg ke atas label penuh.
// `TautanNav` sengaja `w-fit` (bukan `w-full`): ia diletakkan di kolom tengah
// header yang sudah `justify-center`/`flex-1`. Dulu `w-full` dipakai bersama
// `justify-center`; sekarang pemusatan itu tanggung jawab wadah, sehingga
// kotak nav tidak lagi meregang selebar kolom dan tata letaknya tidak bisa
// bergeser diam-diam saat lebar kolom berubah.
//
// Gaya tautan: sasaran sentuh `inline-flex items-center` (bukan teks dengan
// garis bawah yang menempel di baseline), jadi label duduk tepat di garis
// tengah header. Penanda aktif berupa pil tint kuning + teks penuh — lebih
// tenang dibanding garis bawah 2px yang mudah terlihat patah saat transisi.
export function TautanNav({ items }: { items: ItemNavPublik[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigasi utama"
      className="hidden w-fit items-center justify-center md:flex"
    >
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const sekarang = aktif(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={sekarang ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors",
                  sekarang
                    ? "bg-kuning-papan/15 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="lg:hidden">{LABEL_PENDEK[item.href] ?? item.label}</span>
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
