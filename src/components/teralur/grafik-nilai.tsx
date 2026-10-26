"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import { useInView, useReducedMotion } from "motion/react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatRupiah, formatRupiahRingkas } from "@/lib/format-rupiah";

// Grafik batang "Nilai kontrak: papan vs catatan resmi" (chart-first, Warga).
// Nilai penuh rupiah masuk sebagai prop; sumbu dan label memakai bentuk ringkas.
// Gaya modern: grid garis rambut, batang membulat, label angka mono; warna dari
// token (papan kuning papan, resmi cocok). Batang tumbuh dari bawah (scaleY,
// anime.js) saat pertama terlihat; reduced motion langsung keadaan akhir.

const MONO = "ui-monospace, 'Geist Mono', monospace";

const config = {
  papan: { label: "Data papan", color: "var(--kuning-papan)" },
  resmi: { label: "Catatan resmi", color: "var(--cocok)" },
} satisfies ChartConfig;

export function GrafikNilai({
  papan,
  resmi,
}: {
  papan: number | null;
  resmi: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-64px" });
  const kurangiGerak = useReducedMotion();

  useEffect(() => {
    if (!inView || kurangiGerak) return;
    const root = ref.current;
    if (!root) return;
    const batang = root.querySelectorAll<SVGPathElement>(".recharts-bar-rectangle path");
    if (batang.length === 0) return;
    batang.forEach((el) => {
      el.style.transformBox = "fill-box";
      el.style.transformOrigin = "50% 100%";
    });
    const instance = animate(batang, {
      scaleY: [0, 1],
      duration: 650,
      delay: stagger(90),
      ease: "out(3)",
    });
    return () => {
      instance.pause();
    };
  }, [inView, kurangiGerak]);

  const data = [
    { sisi: "Data papan", papan, resmi: null },
    { sisi: "Catatan resmi", papan: null, resmi },
  ].filter((baris) => baris.papan !== null || baris.resmi !== null);

  if (data.length === 0) return null;

  return (
    <div ref={ref}>
      <ChartContainer config={config} className="h-44 w-full">
        <BarChart data={data} margin={{ top: 24, left: 4, right: 4 }}>
          {/* Grid garis rambut solid — tanpa putus-putus, tanpa garis tegak. */}
          <CartesianGrid vertical={false} stroke="rgb(27 25 23 / 12%)" />
          <XAxis
            dataKey="sisi"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "rgb(27 25 23 / 60%)" }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <span>
                    {name === "papan" ? "Data papan" : "Catatan resmi"}:{" "}
                    <span className="font-mono font-semibold">
                      {formatRupiah(Number(value))}
                    </span>
                  </span>
                )}
                hideLabel
              />
            }
          />
          <Bar dataKey="papan" fill="var(--color-papan)" radius={6} barSize={56} isAnimationActive={false}>
            <LabelList
              dataKey="papan"
              position="top"
              fontSize={11}
              fontFamily={MONO}
              formatter={(value: unknown) =>
                value === null || value === undefined ? "" : formatRupiahRingkas(Number(value))
              }
            />
          </Bar>
          <Bar dataKey="resmi" fill="var(--color-resmi)" radius={6} barSize={56} isAnimationActive={false}>
            <LabelList
              dataKey="resmi"
              position="top"
              fontSize={11}
              fontFamily={MONO}
              formatter={(value: unknown) =>
                value === null || value === undefined ? "" : formatRupiahRingkas(Number(value))
              }
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
