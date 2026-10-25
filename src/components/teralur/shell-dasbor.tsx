"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSpeedIcon,
  FileValidationIcon,
  MapIcon,
  NoteIcon,
  AccountSetting01Icon,
  Menu01Icon,
  Cancel01Icon,
  Logout03Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DAFTAR_ROLE, META_ROLE, navUntukRole, simpanCookiePeran, type AppRole } from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const IKON_NAV: Record<string, typeof DashboardSpeedIcon> = {
  "/dashboard": DashboardSpeedIcon,
  "/dashboard/proyek": FileValidationIcon,
  "/dashboard/peta": MapIcon,
  "/dashboard/laporan": NoteIcon,
  "/dashboard/pengaturan": AccountSetting01Icon,
};

// Logo ubin kuning inline: kotak rounded dengan huruf "t" tebal + wordmark.
function LogoTeralur() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Teralur, ke beranda">
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-lg bg-kuning-papan font-heading text-lg font-bold leading-none text-hitam-aspal"
      >
        t
      </span>
      <span className="font-heading text-lg font-bold tracking-tight">teralur</span>
    </Link>
  );
}

function DaftarNav({ peran, onNavigasi }: { peran: AppRole; onNavigasi?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi dasbor" className="grid gap-0.5">
      {navUntukRole(peran).map((item) => {
        const Ikon = IKON_NAV[item.href] ?? DashboardSpeedIcon;
        const aktif =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigasi}
            aria-current={aktif ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
              aktif
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <HugeiconsIcon icon={Ikon} className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function PengalihPeran({ peran }: { peran: AppRole }) {
  const router = useRouter();
  function ganti(nilai: AppRole) {
    simpanCookiePeran(nilai);
    router.refresh();
  }
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">Sudut pandang</p>
      <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted p-1">
        {DAFTAR_ROLE.map((nilai) => (
          <button
            key={nilai}
            type="button"
            onClick={() => ganti(nilai)}
            aria-pressed={peran === nilai}
            title={META_ROLE[nilai].label}
            className={cn(
              "rounded-lg px-1 py-1.5 text-xs font-medium transition-colors",
              peran === nilai
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {META_ROLE[nilai].label}
          </button>
        ))}
      </div>
    </div>
  );
}

function IsiAkun({ email }: { email: string }) {
  const router = useRouter();
  const [sedangKeluar, setSedangKeluar] = useState(false);

  async function keluar() {
    setSedangKeluar(true);
    try {
      const supabase = await getSupabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/50 p-3">
      <p className="truncate text-sm font-medium" title={email}>
        {email}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">Akun pengelola terverifikasi</p>
      <button
        type="button"
        onClick={keluar}
        disabled={sedangKeluar}
        className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50"
      >
        <HugeiconsIcon icon={Logout03Icon} className="size-3.5" />
        {sedangKeluar ? "Memproses…" : "Keluar"}
      </button>
    </div>
  );
}

export function ShellDasbor({
  email,
  peran,
  children,
}: {
  email: string;
  peran: AppRole;
  children: React.ReactNode;
}) {
  const [menuTerbuka, setMenuTerbuka] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-border bg-card p-4 print:hidden lg:flex">
        <div className="px-1 pt-2">
          <LogoTeralur />
        </div>
        <PengalihPeran peran={peran} />
        <DaftarNav peran={peran} />
        <div className="mt-auto">
          <IsiAkun email={email} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bilah atas mobile */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 print:hidden lg:hidden">
          <LogoTeralur />
          <button
            type="button"
            aria-label={menuTerbuka ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuTerbuka}
            onClick={() => setMenuTerbuka((nilai) => !nilai)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted"
          >
            <HugeiconsIcon icon={menuTerbuka ? Cancel01Icon : Menu01Icon} className="size-4.5" />
          </button>
        </header>
        {menuTerbuka && (
          <div className="sticky top-14 z-40 px-4 pb-4 lg:hidden">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
              <PengalihPeran peran={peran} />
              <div className="mt-3">
                <DaftarNav peran={peran} onNavigasi={() => setMenuTerbuka(false)} />
              </div>
              <div className="mt-4">
                <IsiAkun email={email} />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

/** Tautan gaya-tombol untuk CTA di dalam dasbor (navigasi klien Next). */
export function TautanTombol({
  href,
  children,
  variant,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}) {
  return (
    <Link href={href} className={buttonVariants({ variant, className })}>
      {children}
    </Link>
  );
}
