// Kelas tombol aman-server: ui/button.tsx ber-"use client" (react-aria),
// sehingga buttonVariants() tidak boleh dipanggil dari komponen server.
// Helper ini meniru varian yang dipakai komponen server (default/outline,
// ukuran default/lg) tanpa mengimpor berkas klien. Jaga tetap selaras.

type Varian = "default" | "outline";
type Ukuran = "default" | "lg";

const DASAR =
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-sm font-medium transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/30 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const VARIAN: Record<Varian, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/85",
  outline: "border border-border bg-card hover:bg-muted",
};

const UKURAN: Record<Ukuran, string> = {
  default: "h-9 px-4",
  lg: "h-11 px-6",
};

export function kelasTombol(
  varian: Varian = "default",
  ukuran: Ukuran = "default",
): string {
  return `${DASAR} ${VARIAN[varian]} ${UKURAN[ukuran]}`;
}
