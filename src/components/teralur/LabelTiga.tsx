import type { Label } from "@/lib/label";

export type LabelTigaProps = {
  label: Label;
  className?: string;
};

// TODO: render the three-tier provenance label (tercatat / hitungan / belum_diketahui)
// with its own token color per tier.
export function LabelTiga({ label, className }: LabelTigaProps) {
  const labels: Record<Label, string> = {
    tercatat: "TERCATAT",
    hitungan: "HITUNGAN",
    belum_diketahui: "BELUM DIKETAHUI",
  };
  const classes: Record<Label, string> = {
    tercatat: "border-black bg-black text-white",
    hitungan: "border-black bg-[#FFC400] text-black",
    belum_diketahui: "border-dashed border-neutral-500 bg-neutral-100 text-neutral-700",
  };
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[0.65rem] font-bold tracking-wide ${classes[label]}${className ? ` ${className}` : ""}`}
    >
      {labels[label]}
    </span>
  );
}
