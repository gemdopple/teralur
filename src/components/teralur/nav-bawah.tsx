"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AppStoreIcon,
  Home01Icon,
  MapIcon,
  QrCodeScanIcon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// Nav bawah melayang (ponsel): selalu terlihat di atas konten agar warga
// berpindah halaman dengan satu jempol. Tengah: tombol pindai QR menonjol —
// membuka /jelajah?pindai=1#pindai yang langsung menyalakan pemindai kamera.
// Desktop (md ke atas) tetap memakai navigasi atas; bar ini md:hidden.
// Offset bawah mengikuti safe-area ponsel (:notch/home-indicator).

type ItemBawah = { href: string; label: string; ikon: typeof Home01Icon };

const ITEM_KIRI: ItemBawah[] = [
  { href: "/", label: "Beranda", ikon: Home01Icon },
  { href: "/jelajah", label: "Jelajah", ikon: MapIcon },
];

const ITEM_KANAN: ItemBawah[] = [
  { href: "/examples", label: "Contoh", ikon: AppStoreIcon },
  { href: "/login", label: "Masuk", ikon: User02Icon },
];

function aktif(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SelNav({ item, hidup }: { item: ItemBawah; hidup: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={hidup ? "page" : undefined}
      className={cn(
        "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-medium transition-colors",
        hidup ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <HugeiconsIcon icon={item.ikon} className="size-5" strokeWidth={hidup ? 2.2 : 1.7} />
      <span className="max-w-full truncate">{item.label}</span>
    </Link>
  );
}

export function NavBawah() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi bawah" className="md:hidden">
      {/* Latar pudar di belakang bar + FAB: konten yang lewat di bawahnya
          memudar menyatu, bukan menabrak tombol menonjol (z-40 < bar z-50). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-24 bg-gradient-to-t from-background via-background/80 to-transparent"
      />
      <div
        className="fixed inset-x-3 z-50"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
      <div className="relative mx-auto grid max-w-md grid-cols-5 items-center gap-1 rounded-2xl border border-border bg-card/95 px-2 py-1.5 shadow-xl shadow-hitam-aspal/15 backdrop-blur">
        {ITEM_KIRI.map((item) => (
          <SelNav key={item.href} item={item} hidup={aktif(pathname, item.href)} />
        ))}

        {/* Sel kosong di tengah — tempat tombol pindai menonjol berdiri. */}
        <div aria-hidden className="order-none" />

        {/* Tombol pindai QR menonjol di tengah bar — halaman pindai khusus. */}
        <Link
          href="/pindai"
          aria-label="Pindai QR papan proyek"
          className="absolute -top-6 left-1/2 flex size-14 -translate-x-1/2 flex-col items-center justify-center rounded-full border-4 border-card bg-kuning-papan text-hitam-aspal shadow-lg shadow-hitam-aspal/25 transition-transform active:scale-95"
        >
          <HugeiconsIcon icon={QrCodeScanIcon} className="size-7" strokeWidth={2} />
          <span className="sr-only">Pindai QR</span>
        </Link>

        {ITEM_KANAN.map((item) => (
          <SelNav key={item.href} item={item} hidup={aktif(pathname, item.href)} />
        ))}
      </div>
      </div>
    </nav>
  );
}
