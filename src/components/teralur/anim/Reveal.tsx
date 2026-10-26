"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Tunda awal animasi dalam detik (untuk orkestrasi manual). */
  delay?: number;
};

// Pembungkus fade-up: elemen muncul saat masuk viewport, sekali saja.
// Reduced motion: y dinolkan sehingga hanya opasitas yang beranimasi.
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const kurangiGerak = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: kurangiGerak ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
