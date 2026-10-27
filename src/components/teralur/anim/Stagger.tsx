"use client";

import type { ReactNode } from "react";

type StaggerGroupProps = {
  children: ReactNode;
  className?: string;
};

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
};

// Grup stagger ringan: anak-anak StaggerItem muncul bergantian lewat jeda
// animasi CSS. Tidak memakai observer motion — lihat catatan di Reveal.tsx.
export function StaggerGroup({ children, className }: StaggerGroupProps) {
  return <div className={className}>{children}</div>;
}

// Anak stagger: fade-up dengan jeda bertingkat yang diturunkan dari indeks
// anak lewat CSS nth-child (lihat .animate-reveal di globals.css).
export function StaggerItem({ children, className }: StaggerItemProps) {
  return <div className={`animate-reveal ${className ?? ""}`}>{children}</div>;
}
