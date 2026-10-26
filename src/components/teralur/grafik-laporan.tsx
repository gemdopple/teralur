"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { useInView, useReducedMotion } from "motion/react";
import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Donat laporan warga (F-14): jumlah laporan per keadaan, berlabel HITUNGAN.
// Nilai 0 total digambar sebagai lingkaran abu (C-03: label angka, bukan persen).
// Warna dari token: aktivitas cocok, sepi netral, selesai tinta. Donat muncul
// dengan sapuan searah jarum jam (mask conic-gradient beranimasi CSS variable
// --sweep lewat anime.js) sekali saat pertama terlihat; reduced motion tanpa
// sapuan — donat langsung penuh.

const config = {
  aktivitas: { label: "Ada aktivitas pekerjaan", color: "var(--cocok)" },
  sepi: { label: "Tidak terlihat aktivitas", color: "var(--netral)" },
  selesai: { label: "Tampak selesai", color: "var(--hitam-aspal)" },
} satisfies ChartConfig;

export function GrafikLaporan({
  aktif,
  sepi,
  selesai,
}: {
  aktif: number;
  sepi: number;
  selesai: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-64px" });
  const kurangiGerak = useReducedMotion();

  useEffect(() => {
    if (!inView || kurangiGerak) return;
    const root = ref.current;
    if (!root) return;
    // Sapuan: tutup donat dengan mask conic yang sudutnya beranimasi;
    // mask dilepas setelah selesai agar tooltip tak pernah terpotong.
    const mask = "conic-gradient(#000 calc(var(--sweep) * 1%), transparent 0)";
    root.style.setProperty("--sweep", "0");
    root.style.maskImage = mask;
    root.style.webkitMaskImage = mask;
    const instance = animate(root, {
      "--sweep": [0, 360],
      duration: 700,
      ease: "out(3)",
      onComplete: () => {
        root.style.removeProperty("mask-image");
        root.style.removeProperty("-webkit-mask-image");
        root.style.removeProperty("--sweep");
      },
    });
    return () => {
      instance.pause();
      root.style.removeProperty("mask-image");
      root.style.removeProperty("-webkit-mask-image");
      root.style.removeProperty("--sweep");
    };
  }, [inView, kurangiGerak]);

  const total = aktif + sepi + selesai;
  const data = [
    { keadaan: "aktivitas", nilai: aktif, fill: "var(--color-aktivitas)" },
    { keadaan: "sepi", nilai: sepi, fill: "var(--color-sepi)" },
    { keadaan: "selesai", nilai: selesai, fill: "var(--color-selesai)" },
  ];

  if (total === 0) {
    return (
      <div className="grid h-40 w-full place-items-center rounded-xl bg-muted/50 text-sm text-muted-foreground">
        Belum ada laporan warga untuk proyek ini.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div ref={ref} className="shrink-0">
        <ChartContainer config={config} className="h-40 w-40">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={total === 0 ? [{ keadaan: "kosong", nilai: 1, fill: "var(--muted)" }] : data}
              dataKey="nilai"
              nameKey="keadaan"
              innerRadius={44}
              outerRadius={70}
              strokeWidth={2}
              stroke="var(--card)"
              isAnimationActive={false}
            />
          </PieChart>
        </ChartContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {data.map((baris) => (
          <li key={baris.keadaan} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              {/* Titik bulat kecil sebagai tanda warna. */}
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: baris.fill }}
              />
              <span className="truncate">
                {config[baris.keadaan as keyof typeof config].label}
              </span>
            </span>
            <span className="font-mono font-semibold tabular-nums">{baris.nilai}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
