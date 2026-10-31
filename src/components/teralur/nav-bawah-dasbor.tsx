"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSpeedIcon,
  FileValidationIcon,
  MapIcon,
  NoteIcon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/roles";

// Nav bawah dasbor (ponsel): versi pengelola dari nav-bawah publik. Menu
// mengikuti peran akun — pemerintah/admin mendapat Laporan warga, kontraktor
// tidak. Ubin tengah "Proyek" memakai gradasi brand senada dengan tile logo;
// sel "Akun" membuka halaman akun sendiri (info akun, ganti kata sandi,
// keluar). Bar muncul hanya di dalam dasbor (dipasang ShellDasbor); situs
// publik tetap memakai nav-bawah.

type ItemDasbor = { href: string; label: string; ikon: typeof DashboardSpeedIcon };

function aktif(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SelNav({ item, hidup }: { item: ItemDasbor; hidup: boolean }) {
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

export function NavBawahDasbor({ peran }: { peran: AppRole }) {
  const pathname = usePathname();

  const kiri: ItemDasbor[] = [
    { href: "/dashboard", label: "Ringkasan", ikon: DashboardSpeedIcon },
    { href: "/dashboard/peta", label: "Peta", ikon: MapIcon },
  ];
  const kanan: ItemDasbor[] = [
    // Laporan warga: pemerintah + admin (sama dengan NAV_DASBOR di roles.ts).
    ...(peran === "kontraktor"
      ? []
      : [{ href: "/dashboard/laporan", label: "Laporan", ikon: NoteIcon }]),
    { href: "/dashboard/akun", label: "Akun", ikon: UserAccountIcon },
  ];

  return (
    <nav aria-label="Navigasi dasbor" className="print:hidden md:hidden">
      {/* Latar pudar di belakang bar — sama dengan nav bawah publik. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-24 bg-gradient-to-t from-background via-background/80 to-transparent"
      />
      <div
        className="fixed inset-x-3 z-50"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        {/* items-end: dasar semua sel sejajar; ubin tengah lebih tinggi dari
            ikon biasa namun tetap di dalam bar. */}
        <div
          className={cn(
            "relative mx-auto grid items-end gap-1 rounded-3xl border border-border bg-card/95 px-2 pb-2 pt-2 shadow-xl shadow-hitam-aspal/10 backdrop-blur",
            // Pemerintah/admin: 2 kanan → 5 sel; kontraktor: 1 kanan → 4 sel.
            kanan.length === 2 ? "max-w-md grid-cols-5" : "max-w-sm grid-cols-4",
          )}
        >
          {kiri.map((item) => (
            <SelNav key={item.href} item={item} hidup={aktif(pathname, item.href)} />
          ))}

          {/* Ubin tengah: daftar proyek — jantung dasbor semua peran. Satu
              keadaan: ikon putih di atas gradasi brand, tanpa varian aktif. */}
          <Link
            href="/dashboard/proyek"
            className="flex flex-col items-center gap-1 px-1"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-hitam-aspal/25 transition-transform active:scale-95">
              <HugeiconsIcon icon={FileValidationIcon} className="size-6" strokeWidth={2.2} />
            </span>
            <span className="text-[11px] font-semibold leading-none text-foreground">
              Proyek
            </span>
          </Link>

          {kanan.map((item) => (
            <SelNav key={item.href} item={item} hidup={aktif(pathname, item.href)} />
          ))}
        </div>
      </div>
    </nav>
  );
}
