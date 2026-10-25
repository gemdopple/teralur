export type BarisJejak = {
  label: string;
  nilai: string;
};

export type PanelJejakProps = {
  judul: string;
  baris: BarisJejak[];
  className?: string;
};

// Panel jejak — kartu lembut modern: rounded-2xl dengan bayangan tipis,
// label kecil abu dan nilai teks isi. Judul panel tetap heading tinta.
export function PanelJejak({ judul, baris, className }: PanelJejakProps) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className ?? ""}`}
      aria-label={judul}
    >
      <h3 className="font-heading text-base font-semibold tracking-tight">{judul}</h3>
      <dl className="mt-3 divide-y divide-border">
        {baris.map((item, index) => (
          <div key={`${item.label}-${index}`} className="grid gap-1 py-2.5 sm:grid-cols-[12rem_1fr]">
            <dt className="text-sm font-medium text-muted-foreground sm:pt-0.5">{item.label}</dt>
            <dd className="break-words text-sm">{item.nilai}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
