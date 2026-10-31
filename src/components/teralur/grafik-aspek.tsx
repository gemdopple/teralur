"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { useInView, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  MinusSignCircleIcon,
  MultiplicationSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export type BarisAspek = {
  label: string;
  /** Keadaan kecocokan aspek: cocok (centang), selisih (silang), kosong (rulis). */
  state: "cocok" | "selisih" | "kosong";
  /** Persen selisih untuk keadaan "selisih"; ditampilkan di sisi kanan label. */
  persen?: number;
  /** Kalimat keadaan dari kalimatField — tampil di bawah label per aspek. */
  kalimat?: string;
};

const IKON_KEADAAN = {
  cocok: CheckmarkCircle02Icon,
  selisih: MultiplicationSignCircleIcon,
  kosong: MinusSignCircleIcon,
} as const;

const WARNA_KEADAAN = {
  cocok: "text-cocok",
  selisih: "text-selisih",
  kosong: "text-netral",
} as const;

// GrafikAspek — "Kecocokan per aspek": tiga baris (Nama paket / Penyedia /
// Nilai kontrak) dengan ikon keadaan dari token warna, menggantikan bar
// progres (permintaan PM 2026-10-31): cocok = centang hijau, selisih = silang
// oranye berlabel persen, kosong = rulis redup berlabel "Belum terisi".
// Ikon muncul membesar dari kecil (anime.js, sekali saat pertama terlihat;
// reduced motion langsung keadaan akhir).
export function GrafikAspek({ baris }: { baris: BarisAspek[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-64px" });
  const kurangiGerak = useReducedMotion();

  useEffect(() => {
    if (!inView || kurangiGerak) return;
    const root = ref.current;
    if (!root) return;
    const ikon = root.querySelectorAll<HTMLElement>("[data-ikon-aspek]");
    if (ikon.length === 0) return;
    const instance = animate(ikon, {
      scale: [0.6, 1],
      opacity: [0, 1],
      duration: 450,
      delay: stagger(90),
      ease: "out(3)",
    });
    return () => {
      instance.pause();
    };
  }, [inView, kurangiGerak]);

  return (
    <div ref={ref} className="space-y-4">
      {baris.map((item) => {
        const lebar = item.state === "selisih" ? Math.min(Math.max(item.persen ?? 60, 0), 100) : 100;
        return (
          <div key={item.label} className="flex items-start gap-3">
            <HugeiconsIcon
              data-ikon-aspek
              icon={IKON_KEADAAN[item.state]}
              aria-hidden
              strokeWidth={2}
              className={cn("mt-0.5 size-7 shrink-0", WARNA_KEADAAN[item.state])}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{item.label}</p>
                {item.state === "selisih" ? (
                  <span className="font-mono text-xs font-semibold tabular-nums text-selisih-teks">
                    {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(lebar)}%
                  </span>
                ) : item.state === "kosong" ? (
                  <span className="text-xs text-muted-foreground">Belum terisi</span>
                ) : null}
              </div>
              {item.kalimat && (
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.kalimat}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
