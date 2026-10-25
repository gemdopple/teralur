"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type BarisAspek = {
  label: string;
  /** Keadaan kecocokan aspek: cocok (bar penuh), selisih (bar sebagian), kosong. */
  state: "cocok" | "selisih" | "kosong";
  /** Lebar bar selisih dalam persen; bila kosong dipakai 60 (nama/penyedia). */
  persen?: number;
  /** Kalimat keadaan dari kalimatField — tampil di bawah bar per aspek. */
  kalimat?: string;
};

// GrafikAspek — "Kecocokan per aspek": tiga baris (Nama paket / Penyedia /
// Nilai kontrak) dengan bar horizontal dari token warna. cocok = bar hijau
// penuh; selisih = bar oranye sebagian berlabel persen; kosong = lintasan
// redup dengan teks "Belum terisi". Bar tumbuh dari kiri (anime.js, sekali
// saat pertama terlihat; reduced motion langsung keadaan akhir).
export function GrafikAspek({ baris }: { baris: BarisAspek[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-64px" });
  const kurangiGerak = useReducedMotion();

  useEffect(() => {
    if (!inView || kurangiGerak) return;
    const root = ref.current;
    if (!root) return;
    const bar = root.querySelectorAll<HTMLDivElement>("[data-bar-aspek]");
    if (bar.length === 0) return;
    bar.forEach((el) => {
      el.style.transformOrigin = "0% 50%";
    });
    const instance = animate(bar, {
      scaleX: [0, 1],
      duration: 650,
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
          <div key={item.label}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{item.label}</p>
              {item.state === "selisih" ? (
                <span className="font-mono text-xs font-semibold tabular-nums text-selisih">
                  {new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(lebar)}%
                </span>
              ) : item.state === "kosong" ? (
                <span className="text-xs text-muted-foreground">Belum terisi</span>
              ) : null}
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              {item.state !== "kosong" && (
                <div
                  data-bar-aspek
                  style={{ width: `${lebar}%` }}
                  className={cn(
                    "h-full rounded-full",
                    item.state === "cocok" ? "bg-cocok" : "bg-selisih",
                  )}
                />
              )}
            </div>
            {item.kalimat && (
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{item.kalimat}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
