"use client";

import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// Tombol ganti tema. Ikon murni CSS (dark:hidden / dark:block) — tanpa state,
// tanpa lompatan ikon setelah hidrasi. Pertukaran tema diberi animasi mikro:
// View Transitions API menumbuhkan lingkaran warna baru dari titik klik
// (cross-fade bawaan dimatikan di globals.css). Peramban tanpa dukungan API —
// atau pengguna dengan gerak berkurang — langsung berganti tanpa animasi.

type DokumenTransisi = Document & {
  startViewTransition?: (perubahan: () => void) => { ready: Promise<void> };
};

export function TombolTema({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  function gantiTema(event: React.MouseEvent<HTMLButtonElement>) {
    const berikut = resolvedTheme === "dark" ? "light" : "dark";
    const doc = document as DokumenTransisi;
    const gerakKurang = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!doc.startViewTransition || gerakKurang) {
      setTheme(berikut);
      return;
    }

    // Aktivasi keyboard (clientX/Y = 0) → pijar dari tengah layar.
    const x = event.clientX || window.innerWidth / 2;
    const y = event.clientY || window.innerHeight / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transisi = doc.startViewTransition(() => {
      // flushSync: kelas .dark wajib terpasang SEBELUM tangkapan "baru" —
      // tanpa ini snapshot lama dan baru identik dan tidak ada animasi.
      flushSync(() => setTheme(berikut));
    });

    transisi.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 450,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }

  return (
    <button
      type="button"
      onClick={gantiTema}
      aria-label="Ganti tema terang atau gelap"
      title="Ganti tema"
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
    >
      <HugeiconsIcon icon={Sun03Icon} className="hidden size-5 dark:block" />
      <HugeiconsIcon icon={Moon02Icon} className="size-5 dark:hidden" />
    </button>
  );
}
