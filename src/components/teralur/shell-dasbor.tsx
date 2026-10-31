"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSpeedIcon,
  FileValidationIcon,
  MapIcon,
  NoteIcon,
  UserAccountIcon,
  Menu01Icon,
  Cancel01Icon,
  Logout03Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { LogoTeralur } from "@/components/teralur/logo";
import { TombolTema } from "@/components/teralur/tombol-tema";
import { NavBawahDasbor } from "@/components/teralur/nav-bawah-dasbor";
import { META_ROLE, navAktif, navUntukRole, type AppRole } from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const IKON_NAV: Record<string, typeof DashboardSpeedIcon> = {
  "/dashboard": DashboardSpeedIcon,
  "/dashboard/proyek": FileValidationIcon,
  "/dashboard/peta": MapIcon,
  "/dashboard/laporan": NoteIcon,
  "/dashboard/akun": UserAccountIcon,
};

function DaftarNav({
  peran,
  onNavigasi,
  runtuh = false,
  perluas,
}: {
  peran: AppRole;
  onNavigasi?: () => void;
  /** Mode runtuh: ikon saja dengan tooltip (hanya sidebar desktop). */
  runtuh?: boolean;
  /** Dipanggil bila item induk diklik saat sidebar runtuh → sidebar diperluas. */
  perluas?: () => void;
}) {
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
          "flex items-center gap-2.5 rounded-full py-2 text-sm font-medium transition-colors",
          runtuh ? "justify-center px-0" : "px-3",
          aktif
            ? "bg-kuning-papan/15 text-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        );
        return (
          <div key={item.href} className="grid gap-0.5">
            {adaAnak ? (
              <button
                type="button"
                onClick={() => {
                  // Sidebar runtuh tak punya ruang untuk sub-menu: klik ikon
                  // memperluas sidebar lalu membuka sub-menunya.
                  if (runtuh) {
                    perluas?.();
                    alihkan(item.href, true);
                    return;
                  }
                  alihkan(item.href, !terbukaSekarang);
                }}
                aria-expanded={terbukaSekarang}
                title={runtuh ? item.label : undefined}
                aria-label={runtuh ? item.label : undefined}
                className={kelasItem}
              >
                <HugeiconsIcon icon={Ikon} className="size-4" />
                {!runtuh && item.label}
                {!runtuh && (
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className={cn("ml-auto size-3.5 transition-transform", terbukaSekarang && "rotate-90")}
                  />
                )}
              </button>
            ) : (
              <Link
                href={item.href}
                onClick={onNavigasi}
                aria-current={pathname === item.href ? "page" : undefined}
                title={runtuh ? item.label : undefined}
                aria-label={runtuh ? item.label : undefined}
                className={kelasItem}
              >
                <HugeiconsIcon icon={Ikon} className="size-4" />
                {!runtuh && item.label}
              </Link>
            )}
            {/* Sub-menu (dropdown satu tingkat): tampil saat induknya dibuka,
                tanpa navigasi ke halaman ringkasan. */}
            {adaAnak && terbukaSekarang && !runtuh && (
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

function IsiAkun({ email, runtuh = false }: { email: string; runtuh?: boolean }) {
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

  // Mode runtuh: satu tombol ikon menuju halaman akun — info, ganti kata
  // sandi, dan keluar tersedia di sana.
  if (runtuh) {
    return (
      <div className="flex justify-center">
        <Link
          href="/dashboard/akun"
          title="Akun saya — info, kata sandi, dan keluar"
          aria-label="Akun saya — info, kata sandi, dan keluar"
          className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HugeiconsIcon icon={UserAccountIcon} className="size-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <p className="truncate text-sm font-medium" title={email}>
        {email}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">Akun pengelola terverifikasi</p>
      <Link
        href="/dashboard/akun"
        className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
      >
        <HugeiconsIcon icon={UserAccountIcon} className="size-3.5" />
        Akun saya
      </Link>
      <button
        type="button"
        onClick={keluar}
        disabled={sedangKeluar}
        className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50"
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
  // Sidebar desktop bisa diruntuhkan (ikon saja). Pilihan disimpan di
  // localStorage; SSR default terbuka lalu dipulihkan setelah hidrasi.
  const [runtuh, setRuntuh] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- preferensi
    // hanya tersedia di klien (localStorage); render pertama wajib cocok
    // dengan server (terbuka), lalu dipulihkan setelah hidrasi — pola
    // dua-lintasan yang sama dengan next-themes.
    setRuntuh(window.localStorage.getItem("teralur-sidebar-runtuh") === "1");
  }, []);

  function ubahRuntuh(nilai: boolean) {
    setRuntuh(nilai);
    window.localStorage.setItem("teralur-sidebar-runtuh", nilai ? "1" : "0");
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Sidebar desktop — lebar beranimasi saat diruntuhkan */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col gap-6 border-r border-border bg-card p-4 transition-[width] duration-300 ease-in-out print:hidden lg:flex",
          runtuh ? "w-[4.75rem]" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex items-center px-1 pt-2",
            runtuh ? "flex-col gap-1" : "justify-between",
          )}
        >
          <LogoTeralur ukuran={34} denganTeks={!runtuh} />
          <div className={cn("flex items-center gap-1", runtuh && "flex-col")}>
            <TombolTema />
            <button
              type="button"
              onClick={() => ubahRuntuh(!runtuh)}
              aria-label={runtuh ? "Perluas sidebar" : "Ciutkan sidebar"}
              aria-expanded={!runtuh}
              title={runtuh ? "Perluas sidebar" : "Ciutkan sidebar"}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <HugeiconsIcon
                icon={runtuh ? ArrowRight01Icon : ArrowLeft01Icon}
                className="size-4.5"
              />
            </button>
          </div>
        </div>
        {!runtuh && <LabelPeran peran={peran} />}
        <DaftarNav
          key={pathname}
          peran={peran}
          runtuh={runtuh}
          perluas={() => ubahRuntuh(false)}
        />
        <div className="mt-auto">
          <IsiAkun email={email} runtuh={runtuh} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bilah atas mobile */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4 print:hidden lg:hidden">
          <LogoTeralur ukuran={30} />
          <div className="flex items-center gap-1">
            <TombolTema />
            <button
              type="button"
              aria-label={menuTerbuka ? "Tutup menu" : "Buka menu"}
              aria-expanded={menuTerbuka}
              onClick={() => setMenuTerbuka((nilai) => !nilai)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted"
            >
              <HugeiconsIcon icon={menuTerbuka ? Cancel01Icon : Menu01Icon} className="size-4.5" />
            </button>
          </div>
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
        {/* Nav bawah dasbor (ponsel) — menu per peran dengan sel Akun; berbeda
            dari nav publik karena pengguna sudah masuk. */}
        <div aria-hidden className="h-20 print:hidden md:hidden" />
        <NavBawahDasbor peran={peran} />
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
  variant?: "default" | "outline" | "brand";
  className?: string;
}) {
  return (
    <Link href={href} className={buttonVariants({ variant, className })}>
      {children}
    </Link>
  );
}
