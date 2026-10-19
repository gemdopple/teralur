export type BarisJejak = {
  label: string;
  nilai: string;
};

export type PanelJejakProps = {
  judul: string;
  baris: BarisJejak[];
  className?: string;
};

// TODO: render the evidence panel — judul heading plus one row per entry in baris
// (label on the left, value on the right, numbers in JetBrains Mono).
export function PanelJejak({ judul, baris, className }: PanelJejakProps) {
  return <section className={className} aria-label={judul} data-baris={baris.length} />;
}
