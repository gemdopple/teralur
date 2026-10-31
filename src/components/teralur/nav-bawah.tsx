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
// berpindah halaman dengan satu jempol. Tengah: ubin "Pindai" gradasi brand —
// duduk di dalam bar (tidak lagi menonjol ke atas), bentuk squircle senada
// dengan tile logo. Membuka /pindai yang langsung menyalakan pemindai kamera.
// Lima sel dengan ubin pindai tepat di tengah (2 kiri + ubin + 2 kanan).
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
        "flex min-h-11 flex-1 flex-col items-center justify-end gap-1 rounded-xl px-1 pb-0.5 pt-1 text-[11px] font-medium transition-colors",
        hidup ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {/* Satu keadaan wadah — hanya warna ikon yang berubah: kuning saat aktif. */}
      <span className="flex size-8 items-center justify-center rounded-full">
        <HugeiconsIcon
          icon={item.ikon}
          className={cn("size-5", hidup && "text-kuning-papan")}
          strokeWidth={2}
        />
      </span>
      <span className="max-w-full truncate leading-none">{item.label}</span>
    </Link>
  );
}

export function NavBawah() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi bawah" className="print:hidden md:hidden">
      {/* Latar pudar di belakang bar: konten yang lewat di bawahnya memudar
          menyatu, bukan menabrak bar (z-40 < bar z-50). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-24 bg-gradient-to-t from-background via-background/80 to-transparent"
      />
      <div
        className="fixed inset-x-3 z-50"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {/* items-end: dasar semua sel sejajar; ubin pindai lebih tinggi dari
            ikon biasa sehingga tetap menonjol TANPA keluar dari bar. */}
        <div className="relative mx-auto grid max-w-md grid-cols-5 items-end gap-1 rounded-3xl border border-border bg-card/95 px-2 pb-2 pt-2 shadow-xl shadow-hitam-aspal/10 backdrop-blur">
          {ITEM_KIRI.map((item) => (
            <SelNav key={item.href} item={item} hidup={aktif(pathname, item.href)} />
          ))}

          {/* Ubin pindai QR di tengah — halaman pindai khusus. Satu keadaan:
              ikon putih di atas gradasi brand (senada tile logo), tanpa
              varian aktif. Label "Pindai" satu kata agar muat di kolom
              sempit (nama lengkap tetap di aria-label). */}
          <Link
            href="/pindai"
            aria-label="Pindai papan — pindai QR papan proyek"
            className="flex flex-col items-center gap-1 px-1"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-hitam-aspal/25 transition-transform active:scale-95">
              <HugeiconsIcon icon={QrCodeScanIcon} className="size-6" strokeWidth={2.2} />
            </span>
            <span className="text-[11px] font-semibold leading-none text-foreground">
              Pindai
            </span>
          </Link>

          {ITEM_KANAN.map((item) => (
            <SelNav key={item.href} item={item} hidup={aktif(pathname, item.href)} />
          ))}
        </div>
      </div>
    </nav>
  );
}
