"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Terang lebih dulu; mode gelap hanya lewat tombol eksplisit (bukan ikut OS).
export function PenyediaTema({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
