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
  return (
    <section className={`rounded-lg border border-neutral-300 bg-white p-4 ${className ?? ""}`} aria-label={judul}>
      <h3 className="font-semibold">{judul}</h3>
      <dl className="mt-3 divide-y divide-neutral-200">
        {baris.map((item, index) => (
          <div key={`${item.label}-${index}`} className="grid gap-1 py-2 sm:grid-cols-[12rem_1fr]">
            <dt className="text-sm text-neutral-600">{item.label}</dt>
            <dd className="break-words text-sm font-medium">{item.nilai}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
