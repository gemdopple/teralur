"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Building01Icon, HardHatIcon, ShieldUserIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/teralur/anim/Reveal";
import {
  DAFTAR_ROLE,
  META_ROLE,
  simpanCookiePeran,
  type AppRole,
} from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// Halaman masuk terpadu (redesign v2): pemilihan peran (mode sudut pandang
// dasbor, disimpan di cookie) + autentikasi Supabase yang sama dengan admin.
// Warga tidak perlu masuk — laporan publik selalu terbuka.
// Tata letak terbagi: panel merek tinta di kiri, formulir bersih di kanan.

const IKON_ROLE = {
  pemerintah: Building01Icon,
  kontraktor: HardHatIcon,
  admin: ShieldUserIcon,
} as const;

const PESAN_GALAT = "Email atau kata sandi salah.";

// Logo inline: ubin kuning membulat dengan "t" tebal + wordmark teralur.
function Logo({ diPanelTinta = false }: { diPanelTinta?: boolean }) {
  return (
    <Link href="/" className="relative flex items-center gap-2.5" aria-label="Teralur, ke beranda">
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-kuning-papan font-heading text-lg font-bold text-hitam-aspal"
      >
        t
      </span>
      <span className={cn("font-heading text-xl font-bold tracking-tight", diPanelTinta && "text-kertas")}>
        teralur
      </span>
    </Link>
  );
}

export default function HalamanMasuk() {
  const router = useRouter();
  const [peran, setPeran] = useState<AppRole>("pemerintah");
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [sedangMasuk, setSedangMasuk] = useState(false);
  const [galat, setGalat] = useState(false);

  // Nyaman: bila sesi sudah ada, langsung ke dasbor. Pemeriksaan tidak
  // memblokir formulir — bila gagal atau lambat, tombol Masuk tetap aktif.
  useEffect(() => {
    let aktif = true;
    getSupabaseBrowser()
      .then((supabase) => supabase.auth.getUser())
      .then(({ data }) => {
        if (aktif && data.user) router.replace("/dashboard");
      })
      .catch(() => {});
    return () => {
      aktif = false;
    };
  }, [router]);

  function pilihPeran(nilai: AppRole) {
    setPeran(nilai);
    // Cookie dibaca layout dasbor untuk menentukan sudut pandang.
    simpanCookiePeran(nilai);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSedangMasuk(true);
    setGalat(false);
    const supabase = await getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: kataSandi,
    });
    if (error) {
      setGalat(true);
      setSedangMasuk(false);
      return;
    }
    // Layout (app) memverifikasi ulang sesi + allowlist di server.
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Panel merek — tinta pekat, teks kertas, butir kuning */}
      <section className="relative hidden flex-col justify-between overflow-hidden rounded-none bg-hitam-aspal p-10 text-kertas lg:flex">
        {/* Pijar kuning lembut di sudut atas */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-kuning-papan/15 blur-3xl"
        />
        <Logo diPanelTinta />
        <Reveal className="relative max-w-md">
          <h2 className="text-balance font-heading text-4xl font-bold tracking-tight">
            Satu akun, tiga sudut pandang.
          </h2>
          <p className="mt-4 text-sm leading-7 text-kertas/70">
            Pilih peran untuk menyesuaikan dasbor. Data ditampilkan langsung dari basis data
            pengelola dan diperbarui berkala.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {DAFTAR_ROLE.map((nilai) => (
              <li key={nilai} className="flex items-start gap-3">
                {/* Butir kuning kecil — satu-satunya kuning pada panel tinta */}
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-kuning-papan" />
                <span>
                  <strong className="font-semibold">{META_ROLE[nilai].label}</strong>
                  <span className="text-kertas/70"> — {META_ROLE[nilai].ringkas}.</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
        <p className="relative text-xs text-kertas/50">
          Warga tidak perlu masuk —{" "}
          <Link href="/jelajah" className="underline underline-offset-4 hover:text-kertas">
            laporan publik selalu terbuka
          </Link>
          .
        </p>
      </section>

      {/* Formulir */}
      <section className="flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>

          <Reveal>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Masuk ke dasbor</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Untuk pengelola: pemerintah, kontraktor, dan admin situs.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <fieldset className="mt-8">
              <legend className="text-sm font-medium text-muted-foreground">Pilih peran</legend>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {DAFTAR_ROLE.map((nilai) => {
                  const meta = META_ROLE[nilai];
                  const Ikon = IKON_ROLE[nilai];
                  return (
                    <button
                      key={nilai}
                      type="button"
                      onClick={() => pilihPeran(nilai)}
                      aria-pressed={peran === nilai}
                      className={cn(
                        "rounded-2xl border p-3.5 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                        peran === nilai
                          ? "border-hitam-aspal bg-hitam-aspal text-kertas shadow-sm"
                          : "border-border bg-card hover:border-foreground/25 hover:shadow-sm",
                      )}
                    >
                      <HugeiconsIcon
                        icon={Ikon}
                        className={cn("size-5", peran === nilai ? "text-kuning-papan" : "text-muted-foreground")}
                      />
                      <span className="mt-2 block text-sm font-semibold">{meta.label}</span>
                      <span
                        className={cn(
                          "mt-0.5 block text-[11px] leading-4",
                          peran === nilai ? "text-kertas/70" : "text-muted-foreground",
                        )}
                      >
                        {meta.ringkas}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-xs leading-5 text-muted-foreground">
                {META_ROLE[peran].deskripsi}
              </p>
            </fieldset>
          </Reveal>

          <Reveal delay={0.16}>
            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              {galat ? (
                <p
                  role="alert"
                  className="rounded-xl border border-selisih bg-selisih/10 px-3.5 py-2.5 text-sm font-medium text-selisih"
                >
                  {PESAN_GALAT}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@instansi.go.id"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sedangMasuk}
                  className="rounded-xl border-border bg-card"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kata-sandi">Kata sandi</Label>
                <Input
                  id="kata-sandi"
                  name="kataSandi"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={kataSandi}
                  onChange={(e) => setKataSandi(e.target.value)}
                  disabled={sedangMasuk}
                  className="rounded-xl border-border bg-card"
                />
              </div>
              <button type="submit" disabled={sedangMasuk} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                {sedangMasuk ? "Memproses…" : `Masuk sebagai ${META_ROLE[peran].label}`}
                {!sedangMasuk && <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />}
              </button>
            </form>
          </Reveal>

          <Reveal delay={0.24}>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Warga?{" "}
              <Link href="/jelajah" className="font-semibold text-primary underline-offset-4 hover:underline">
                Buka laporan publik tanpa akun
              </Link>
            </p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
