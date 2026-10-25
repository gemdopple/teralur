"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { ChipStatus } from "@/components/teralur/ChipStatus";
import { kelasTombol } from "@/lib/kelas-tombol";

// Hero beranda (klien): garis waktu GSAP — judul fade-up per baris, kartu
// pratinjau masuk dengan skala 0.96 -> 1. prefers-reduced-motion: tanpa tween,
// render server sudah berupa keadaan akhir.

export function HeroBeranda() {
  const akar = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: reduce)", () => {
      // Pastikan keadaan akhir, tanpa tween.
      const elemen = akar.current?.querySelectorAll("[data-hero]");
      if (elemen) gsap.set(elemen, { clearProps: "all" });
    });
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { duration: 0.6, ease: "power3.out" } });
        tl.from("[data-hero='lencana']", { opacity: 0, y: 14 })
          .from("[data-hero='baris']", { opacity: 0, y: 22, stagger: 0.12 }, "-=0.3")
          .from("[data-hero='salinan']", { opacity: 0, y: 14 }, "-=0.35")
          .from("[data-hero='cta']", { opacity: 0, y: 14 }, "-=0.35")
          .from("[data-hero='catatan']", { opacity: 0 }, "-=0.3")
          .from(
            "[data-hero='kartu']",
            { opacity: 0, y: 20, scale: 0.96, duration: 0.7 },
            "-=0.4",
          );
      }, akar);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={akar} className="relative overflow-hidden">
      {/* Latar hero: pijar hangat + grid titik yang memudar ke bawah */}
      <div aria-hidden className="absolute inset-0 bg-glow" />
      <div
        aria-hidden
        className="absolute inset-0 bg-dots [mask-image:radial-gradient(56rem_26rem_at_50%_-2rem,black,transparent_72%)]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:pb-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
          <div>
            <Badge
              variant="outline"
              data-hero="lencana"
              className="h-auto gap-2 rounded-full border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
            >
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Transparansi proyek publik
            </Badge>
            <h1 className="text-balance mt-6 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              <span data-hero="baris" className="block">
                Papan proyek yang bisa
              </span>
              <span data-hero="baris" className="block">
                <span className="garis-teks">diperiksa siapa pun.</span>
              </span>
            </h1>
            <p
              data-hero="salinan"
              className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
            >
              Teralur membandingkan informasi di papan proyek dengan catatan pengadaan resmi,
              lalu menyajikannya sebagai laporan sederhana — lengkap dengan sumber, tanggal
              data, dan batasnya.
            </p>
            <div data-hero="cta" className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/jelajah" className={kelasTombol("default", "lg")}>
                Cari proyek di sekitar saya
                <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
              </Link>
              <Link href="/examples" className={kelasTombol("outline", "lg")}>
                Lihat contoh laporan
              </Link>
            </div>
            <p data-hero="catatan" className="mt-5 text-xs text-muted-foreground">
              Tanpa akun untuk warga · Data terbuka dengan sumber jelas
            </p>
          </div>
          <div
            data-hero="kartu"
            className="w-full max-w-md justify-self-center lg:justify-self-end"
          >
            <KartuPratinjau />
          </div>
        </div>
      </div>
    </section>
  );
}

// KartuPratinjau: kartu laporan tiruan yang "melayang" di sisi kanan hero —
// hiasan dengan angka ilustratif, tetap di bawah pita SIMULASI halaman.
function KartuPratinjau() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-5 rounded-[2rem] bg-kuning-papan/25 blur-2xl"
      />
      <article className="relative rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-hitam-aspal/10 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <ChipStatus status="selisih" />
          <span className="font-mono text-xs text-muted-foreground">demo-001</span>
        </div>
        <h2 className="mt-4 font-heading text-base font-semibold leading-snug tracking-tight">
          Rehabilitasi jalan desa (paket contoh)
        </h2>
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Data papan</span>
              <span className="font-mono font-medium">83%</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-kuning-papan" style={{ width: "83%" }} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Catatan resmi</span>
              <span className="font-mono font-medium">87%</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-cocok" style={{ width: "87%" }} />
            </div>
          </div>
        </div>
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-selisih/10 px-3 py-2 text-xs leading-5 text-selisih">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-selisih" />
          Selisih nilai 4,3% terhadap catatan resmi.
        </p>
      </article>
    </div>
  );
}
