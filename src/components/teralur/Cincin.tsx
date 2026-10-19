import type { Cincin as DataCincin } from "@/lib/cincin";
import { LabelTiga } from "@/components/teralur/LabelTiga";

export type CincinProps = {
  data: DataCincin;
  className?: string;
};

// TODO: render the progress ring — an SVG arc driven by data.isian, with
// berjalan/total shown in JetBrains Mono, colored by data.keadaan.
export function Cincin({ data, className }: CincinProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - data.isian);
  const unknown = data.keadaan === "tak_terhitung";
  const description =
    data.keadaan === "tak_terhitung"
      ? "Tanggal mulai tidak tersedia"
      : data.keadaan === "melewati"
        ? `Melewati masa kontrak tercatat ${Math.max(0, (data.berjalan ?? 0) - (data.total ?? 0))} hari. Addendum atau perpanjangan mungkin ada.`
        : `Hari ke-${Math.max(0, data.berjalan ?? 0)} dari ${data.total}`;

  return (
    <figure className={`flex flex-col items-center text-center ${className ?? ""}`} data-keadaan={data.keadaan}>
      <LabelTiga label={unknown ? "belum_diketahui" : "hitungan"} />
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 100 100" role="img" aria-label={description} className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#D9D9D9" strokeWidth="9" />
          {!unknown && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#FFC400"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {unknown ? (
            <span className="max-w-24 text-sm font-semibold">Belum tersedia</span>
          ) : (
            <>
              <span className="font-mono text-2xl font-bold">{Math.max(0, data.berjalan ?? 0)}</span>
              <span className="font-mono text-sm text-neutral-600">dari {data.total} hari</span>
            </>
          )}
        </div>
      </div>
      <figcaption className="mt-3 max-w-sm text-sm text-neutral-700">{description}</figcaption>
      <p className="mt-1 text-xs text-neutral-600">Ini waktu yang telah berjalan, bukan kemajuan fisik.</p>
    </figure>
  );
}
