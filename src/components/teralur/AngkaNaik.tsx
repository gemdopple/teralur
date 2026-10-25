"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type AngkaNaikProps = {
  /** Tampilan akhir angka (hasil lib format, mis. "12" atau "Rp 8,4 M") —
   * dirender apa adanya di server dan dipakai sebagai bingkai akhir animasi. */
  nilai: string;
  className?: string;
};

// Pisah "Rp 8,4 M" -> awalan "Rp ", angka "8,4", akhiran " M".
// Teks tanpa angka (mis. "—") tidak dianimasikan.
const POLA_ANGKA = /^([^0-9.,]*)([0-9][0-9.,]*)(.*)$/;

// Count-up ScrollTrigger: angka naik dari 0 ke nilai akhir (±1 detik, sekali)
// saat sel statistik masuk viewport. prefers-reduced-motion: tanpa tween —
// render server sudah berisi nilai akhir, tanpa tween maupun set ulang.
export function AngkaNaik({ nilai, className }: AngkaNaikProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const hasil = POLA_ANGKA.exec(nilai);
    if (!hasil) return;
    const [, awalan, teksAngka, akhiran] = hasil;
    const target = Number.parseFloat(teksAngka.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(target)) return;
    const desimal = teksAngka.includes(",") ? (teksAngka.split(",")[1]?.length ?? 0) : 0;
    const pemformat = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: desimal,
      maximumFractionDigits: desimal,
    });

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const posisi = { nilai: 0 };
      // Mulai dari 0 sejak mount agar tidak ada kilat nilai akhir sebelum count-up.
      el.textContent = `${awalan}${pemformat.format(0)}${akhiran}`;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          posisi,
          { nilai: 0 },
          {
            nilai: target,
            duration: 1,
            ease: "power1.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
            onUpdate: () => {
              el.textContent = `${awalan}${pemformat.format(posisi.nilai)}${akhiran}`;
            },
            onComplete: () => {
              // Bingkai akhir persis teks dari lib format.
              el.textContent = nilai;
            },
          },
        );
      });
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [nilai]);

  return (
    <span ref={ref} className={className}>
      {nilai}
    </span>
  );
}
