import type { Label } from "@/lib/label";

export type LabelTigaProps = {
  label: Label;
  className?: string;
};

// Tag provenansi tiga tingkat (tercatat / hitungan / belum_diketahui) — gaya
// pil modern: rounded-full, tanpa sudut siku. tercatat tinta pekat, hitungan
// bingkai halus di atas kartu putih, belum_diketahui abu redup.
export function LabelTiga({ label, className }: LabelTigaProps) {
  const labels: Record<Label, string> = {
    tercatat: "TERCATAT",
    hitungan: "HITUNGAN",
    belum_diketahui: "BELUM DIKETAHUI",
  };
  const classes: Record<Label, string> = {
    tercatat: "border-transparent bg-foreground text-background",
    hitungan: "border-border bg-card text-foreground",
    belum_diketahui: "border-transparent bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-widest ${classes[label]}${className ? ` ${className}` : ""}`}
    >
      {labels[label]}
    </span>
  );
}
