"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Variants } from "motion/react";
import type { ReactNode } from "react";

type StaggerGroupProps = {
  children: ReactNode;
  className?: string;
};

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
};

// Grup stagger: anak-anak StaggerItem muncul bergantian (0.07s per anak)
// saat grup masuk viewport, sekali saja.
export function StaggerGroup({ children, className }: StaggerGroupProps) {
  const kurangiGerak = useReducedMotion();

  const varianGrup: Variants = {
    tampak: { transition: { staggerChildren: kurangiGerak ? 0 : 0.07 } },
  };

  return (
    <motion.div
      className={className}
      initial="tersembunyi"
      whileInView="tampak"
      viewport={{ once: true, margin: "-64px" }}
      variants={varianGrup}
    >
      {children}
    </motion.div>
  );
}

// Anak stagger: fade-up yang mengikuti orkestrasi StaggerGroup.
// Reduced motion: y dinolkan sehingga hanya opasitas yang beranimasi.
export function StaggerItem({ children, className }: StaggerItemProps) {
  const kurangiGerak = useReducedMotion();

  const varianItem: Variants = {
    tersembunyi: { opacity: 0, y: kurangiGerak ? 0 : 20 },
    tampak: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div className={className} variants={varianItem}>
      {children}
    </motion.div>
  );
}
