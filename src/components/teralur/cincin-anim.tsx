"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { useInView, useReducedMotion } from "motion/react";
import { CincinWaktu } from "@/components/teralur/Cincin";
import type { TimeRing } from "@/lib/cincin";

// Pembungkus klien untuk CincinWaktu (Cincin.tsx tidak diubah): lengkung
// cincin "digambar" masuk dengan anime.js — stroke-dashoffset beranimasi dari
// lingkaran penuh (tersembunyi) ke nilai akhir sesuai fillRatio, sekali saat
// pertama terlihat. Reduced motion: cincin langsung pada keadaan akhir.
// Radius 42 mengikuti SVG di Cincin.tsx (viewBox 0 0 100 100).
export function CincinWaktuAnim({ ring, className }: { ring: TimeRing; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-64px" });
  const kurangiGerak = useReducedMotion();
  const takTerhitung = ring.state === "unknown";

  useEffect(() => {
    if (!inView || kurangiGerak || takTerhitung) return;
    const root = ref.current;
    const arc = root?.querySelector<SVGCircleElement>("svg circle[stroke-dasharray]");
    if (!root || !arc) return;
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const akhir = circumference * (1 - Math.min(Math.max(ring.fillRatio, 0), 1));
    const instance = animate(arc, {
      strokeDashoffset: [circumference, akhir],
      duration: 700,
      ease: "out(3)",
    });
    return () => {
      instance.pause();
    };
  }, [inView, kurangiGerak, takTerhitung, ring.fillRatio]);

  return (
    <div ref={ref} className={className}>
      <CincinWaktu ring={ring} />
    </div>
  );
}
