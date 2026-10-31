"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { NavBawah } from "@/components/teralur/nav-bawah";
import { LogoTeralur, UbinLogo } from "@/components/teralur/logo";
import { TombolTema } from "@/components/teralur/tombol-tema";
import { DAFTAR_ROLE, META_ROLE } from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

// Halaman masuk terpadu: autentikasi Supabase. Peran TIDAK dipilih di sini —
// peran ditentukan oleh akun (tabel `profiles`) di server, sehingga akun
// kontraktor hanya bisa masuk sebagai kontraktor. Warga tidak perlu masuk —
// laporan publik selalu terbuka.
// Tata letak terbagi: panel gradasi brand di kiri (terang) / panel tinta
// (gelap), formulir bersih di kanan.

const PESAN_GALAT = "Email atau kata sandi salah.";

function bersihkanCookieSesi() {
  // Hapus cookie sesi Supabase yang tersisa di browser. Nama cookie default
  // `sb-<ref>-auth-token`; bentuk -chunk-0 dipakai untuk token besar. Cookie
  // dihapus dengan mengosongkan nilainya DAN menyetel max-age=0 supaya browser
  // benar-benar membuangnya. Dipakai hanya saat server sudah MEMBUKTIKAN bahwa
  // cookie gagal membentuk sesi yang sah (lihat efek di bawah) — jadi ini bukan
  // pembersihan serampangan.
  const kedaluwarsa = "path=/; max-age=0; samesite=lax";
  for (const keping of document.cookie.split(";")) {
    const nama = keping.split("=")[0]?.trim() ?? "";
    if (!nama.startsWith("sb-") || !nama.includes("-auth-token")) continue;
    const akar = nama.replace(/-chunk-\d+$/, "");
    document.cookie = `${nama}=; ${kedaluwarsa}`;
    document.cookie = `${akar}=; ${kedaluwarsa}`;
    document.cookie = `${akar}-chunk-0=; ${kedaluwarsa}`;
  }
}

export default function HalamanMasuk() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [sedangMasuk, setSedangMasuk] = useState(false);
  const [galat, setGalat] = useState(false);

  // Nyaman: bila sesi sudah ada, langsung ke dasbor. Pemeriksaan tidak
  // memblokir formulir — bila gagal atau lambat, tombol Masuk tetap aktif.
  //
  // PENTING: hanya alihkan bila dasbor benar-benar menerima sesi ini. Cookie
  // Supabase yang sudah kedaluwarsa/terputus tetap membuat getSession() di
  // klien mengembalikan sesuatu, tetapi server menolaknya; mengalihkan ke
  // /dashboard berdasarkan klien saja menghasilkan pantulan /login <->
  // /dashboard tanpa akhir. Karena itu tujuannya DIPROBE dulu: satu permintaan
  // ringan ke /dashboard; bila server mengalihkan balik ke /login, cookie
  // rusak — bersihkan, lalu tetap tampilkan formulir masuk.
  useEffect(() => {
    let aktif = true;
    let batal: AbortController | null = null;
    (async () => {
      const supabase = await getSupabaseBrowser();
      const { data } = await supabase.auth.getUser();
      if (!aktif || !data.user) return;
      batal = new AbortController();
      const jawaban = await fetch("/dashboard", {
        redirect: "manual",
        cache: "no-store",
        signal: batal.signal,
      });
      if (!aktif) return;
      if (jawaban.status >= 300 && jawaban.status < 400) {
        // Server menolak sesi ini (dasbor mengalihkan kembali ke /login).
        // Alihkan ke dasbor hanya jika server MENYIMPANNYA; bersihkan cookie
        // agar tidak ada lagi pantulan.
        bersihkanCookieSesi();
        return;
      }
      router.replace("/dashboard");
    })().catch(() => {});
    return () => {
      aktif = false;
      batal?.abort();
    };
  }, [router]);

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
      {/* Panel merek — gradasi brand (terang) / tinta pekat (gelap).
          Catatan: utilitas kustom .bg-brand-gradient berada di layer utilities
          dan menang atas dark:bg-*, sehingga panel memakai bg-linear-to-br
          bawaan Tailwind + dark:bg-none agar tema gelap benar-benar menimpa. */}
      <section className="relative hidden flex-col justify-between bg-linear-to-br from-brand-terang to-brand p-10 text-hitam-aspal dark:bg-none dark:border-r dark:border-border dark:bg-hitam-aspal dark:text-kertas lg:flex">
        {/* Tile kuning menyatu dengan panel gradasi — di panel ini cukup
            wordmark; tile tampil penuh pada panel tinta gelap. */}
        <Link
          href="/"
          aria-label="Teralur, ke beranda"
          className="flex items-center gap-2.5 dark:text-kertas"
        >
          <span aria-hidden className="hidden dark:block">
            <UbinLogo ukuran={34} />
          </span>
          <span className="font-heading text-xl font-bold tracking-tight">teralur</span>
        </Link>
        <Reveal className="relative max-w-md">
          <h2 className="text-balance font-heading text-4xl font-bold tracking-tight">
            Satu akun, satu peran.
          </h2>
          <p className="mt-4 text-sm leading-7 text-hitam-aspal/70 dark:text-kertas/70">
            Peran melekat pada akun Anda dan ditentukan pengelola — kontraktor hanya melihat proyek
            yang ditugaskan kepadanya. Data diambil langsung dari basis data pengelola.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {DAFTAR_ROLE.map((nilai) => (
              <li key={nilai} className="flex items-start gap-3">
                {/* Butir aksen kecil — tinta di panel terang, kuning di panel gelap */}
                <span
                  aria-hidden
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-hitam-aspal dark:bg-kuning-papan"
                />
                <span>
                  <strong className="font-semibold">{META_ROLE[nilai].label}</strong>
                  <span className="text-hitam-aspal/70 dark:text-kertas/70">
                    {" "}
                    — {META_ROLE[nilai].ringkas}.
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
        <p className="relative text-xs text-hitam-aspal/60 dark:text-kertas/50">
          Warga tidak perlu masuk —{" "}
          <Link
            href="/jelajah"
            className="underline underline-offset-4 hover:text-hitam-aspal dark:hover:text-kertas"
          >
            laporan publik selalu terbuka
          </Link>
          .
        </p>
      </section>

      {/* Formulir */}
      <section className="relative flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="absolute right-4 top-4">
          <TombolTema />
        </div>
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <LogoTeralur ukuran={34} />
          </div>

          <Reveal>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Masuk ke dasbor</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Untuk pengelola: pemerintah, kontraktor, dan admin situs.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              {galat ? (
                <p
                  role="alert"
                  className="rounded-lg border border-selisih bg-selisih/10 px-3.5 py-2.5 text-sm font-medium text-selisih-teks"
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
                  className="rounded-lg border-border bg-card"
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
                  className="rounded-lg border-border bg-card"
                />
              </div>
              <button type="submit" disabled={sedangMasuk} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                {sedangMasuk ? "Memproses…" : "Masuk"}
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

      {/* Nav bawah melayang (ponsel) agar navigasi tetap ada sebelum masuk. */}
      <div aria-hidden className="h-20 md:hidden" />
      <NavBawah />
    </main>
  );
}
