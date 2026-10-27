"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { NavBawah } from "@/components/teralur/nav-bawah";
import {
  DashboardSpeedIcon,
  FileValidationIcon,
  MapIcon,
  NoteIcon,
  AccountSetting01Icon,
  UserAccountIcon,
  Menu01Icon,
  Cancel01Icon,
  Logout03Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { META_ROLE, navAktif, navUntukRole, type AppRole } from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const IKON_NAV: Record<string, typeof DashboardSpeedIcon> = {
  "/dashboard": DashboardSpeedIcon,
  "/dashboard/proyek": FileValidationIcon,
  "/dashboard/peta": MapIcon,
  "/dashboard/laporan": NoteIcon,
  "/dashboard/akun": UserAccountIcon,
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
  // Induk beranak adalah pengalih dropdown, bukan tautan: klik membuka
  // sub-menu di tempat. Default mengikuti sektor aktif; klik pengguna
  // menimpanya hanya sampai navigasi berikutnya (komponen diberi
  // key={pathname} di ShellDasbor, jadi state reset tiap pindah halaman).
  const [alihan, setAlihan] = useState<{
    href: string;
    terbuka: boolean;
  } | null>(null);

  function alihkan(href: string, terbukaBerikut: boolean) {
    setAlihan({ href, terbuka: terbukaBerikut });
  }

  return (
    <nav aria-label="Navigasi dasbor" className="grid gap-0.5">
      {navUntukRole(peran).map((item) => {
        const Ikon = IKON_NAV[item.href] ?? DashboardSpeedIcon;
        const aktif = navAktif(item, pathname);
        const anak = item.anak ?? [];
        const adaAnak = anak.length > 0;
        const terbukaSekarang =
          alihan && alihan.href === item.href ? alihan.terbuka : aktif;
        const kelasItem = cn(
          "flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
          aktif
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        );
        return (
          <div key={item.href} className="grid gap-0.5">
            {adaAnak ? (
              <button type="button" onClick={() => alihkan(item.href, !terbukaSekarang)} aria-expanded={terbukaSekarang} className={kelasItem}>
                <HugeiconsIcon icon={Ikon} className="size-4" />
                {item.label}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className={cn("ml-auto size-3.5 transition-transform", terbukaSekarang && "rotate-90")}
                />
              </button>
            ) : (
              <Link href={item.href} onClick={onNavigasi} aria-current={pathname === item.href ? "page" : undefined} className={kelasItem}>
                <HugeiconsIcon icon={Ikon} className="size-4" />
                {item.label}
              </Link>
            )}
            {/* Sub-menu (dropdown satu tingkat): tampil saat induknya dibuka,
                tanpa navigasi ke halaman ringkasan. */}
            {adaAnak && terbukaSekarang && (
              <ul className="ml-[1.4rem] grid gap-0.5 border-l border-border pl-3">
                {anak.map((anakItem) => {
                  const anakAktif =
                    pathname === anakItem.href || pathname.startsWith(`${anakItem.href}/`);
                  return (
                    <li key={anakItem.href}>
                      <Link
                        href={anakItem.href}
                        onClick={onNavigasi}
                        aria-current={anakAktif ? "page" : undefined}
                        className={cn(
                          "block rounded-full py-1.5 pl-2.5 pr-3 text-[13px] font-medium transition-colors",
                          anakAktif
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {anakItem.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Peran kini datang dari akun (server), bukan pilihan pengguna. Panel ini
// hanya menampilkan peran yang sedang aktif — tanpa pengalih sudut pandang.
function LabelPeran({ peran }: { peran: AppRole }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">Peran akun</p>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-kuning-papan" />
        <span className="text-sm font-semibold">{META_ROLE[peran].label}</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
        {META_ROLE[peran].ringkas}.
      </p>
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
    <div className="rounded-lg border border-border bg-muted/50 p-3">
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
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-border bg-card p-4 print:hidden lg:flex">
        <div className="px-1 pt-2">
          <LogoTeralur />
        </div>
        <LabelPeran peran={peran} />
        <DaftarNav key={pathname} peran={peran} />
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
            <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
              <LabelPeran peran={peran} />
              <div className="mt-3">
                <DaftarNav key={pathname} peran={peran} onNavigasi={() => setMenuTerbuka(false)} />
              </div>
              <div className="mt-4">
                <IsiAkun email={email} />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1">{children}</div>
        {/* Nav bawah melayang (ponsel) — sama dengan situs publik, agar navigasi
            tidak hilang setelah masuk dasbor. */}
        <div aria-hidden className="h-20 print:hidden md:hidden" />
        <NavBawah />
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
