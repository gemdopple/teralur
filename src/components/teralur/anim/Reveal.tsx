"use client";

import type { CSSProperties, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Tunda awal animasi dalam detik (untuk orkestrasi manual). */
  delay?: number;
};

// Pembungkus fade-up saat elemen pertama kali muncul.
//
// Sengaja tidak memakai `initial={{ opacity: 0 }}` + `whileInView` (motion).
// Pendekatan itu menulis `opacity: 0` inline dan bergantung pada
// IntersectionObserver untuk menghapusnya. Bila observer tidak sempat
// melaporkan irisan — mis. pada navigasi klien Next.js saat komponen dipasang
// ulang dengan node yang sama — elemen tetap transparan dan isi halaman
// tampak kosong, tanpa jalan pulih selain memuat ulang paksa.
//
// Animasi CSS di bawah tidak punya keadaan "tersembunyi" yang ditulis inline:
// animasinya berjalan sekali saat elemen dipasang dan berakhir pada keadaan
// alami elemen (opacity 1). Tidak ada mekanisme yang bisa gagal terbuka.
// `prefers-reduced-motion` dimatikan di globals.css.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const style: CSSProperties | undefined = delay
    ? { animationDelay: `${delay}s` }
    : undefined;

  return (
    <div className={`animate-reveal ${className ?? ""}`} style={style}>
      {children}
    </div>
  );
}
