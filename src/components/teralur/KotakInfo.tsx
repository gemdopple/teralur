import { cn } from "@/lib/utils";

// Kotak informasi/kosong seragam: satu komponen untuk pesan "belum ada data",
// "basis data belum dikonfigurasi", dan status pencarian — dulu tiap halaman
// menyalin kelasnya sendiri. Server-safe (tanpa hook) agar dipakai di mana saja.

export function KotakInfo({
  children,
  tengah = false,
  className,
}: {
  children: React.ReactNode;
  /** Tengah: pesan kosong di tengah kartu dengan ruang lebih lega. */
  tengah?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card px-4 py-4 text-sm text-muted-foreground shadow-sm",
        tengah && "py-6 text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
