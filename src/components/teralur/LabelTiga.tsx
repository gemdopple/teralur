import type { Label } from "@/lib/label";

export type LabelTigaProps = {
  label: Label;
  className?: string;
};

// TODO: render the three-tier provenance label (tercatat / hitungan / belum_diketahui)
// with its own token color per tier.
export function LabelTiga({ label, className }: LabelTigaProps) {
  return <span className={className} data-label={label} />;
}
