import type { Cincin as DataCincin, TimeRing } from "@/lib/cincin";
import { RING_NOTE } from "@/lib/cincin";
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

// Cincin waktu G.1 (PRD v1.1, E.11 `timeRing`): menerima hasil computeTimeRing
// dari server (empat keadaan: running | over | unknown | not_started) dan
// merender caption baku G.1 apa adanya. Catatan tetap RING_NOTE selalu tampil
// di bawah cincin, apa pun keadaannya (G.1).
export function CincinWaktu({ ring, className }: { ring: TimeRing; className?: string }) {
  const takTerhitung = ring.state === "unknown";
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(Math.max(ring.fillRatio, 0), 1));

  return (
    <figure
      className={`flex flex-col items-center text-center ${className ?? ""}`}
      data-keadaan={ring.state}
    >
      <LabelTiga label={takTerhitung ? "belum_diketahui" : "hitungan"} />
      <div className="relative mt-2 h-40 w-40">
        <svg
          viewBox="0 0 100 100"
          role="img"
          aria-label={ring.caption}
          className="h-full w-full -rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#D9D9D9"
            strokeWidth="9"
          />
          {!takTerhitung && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={ring.state === "over" ? "#D9480F" : "#FFC400"}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {takTerhitung ? (
            <span className="text-2xl font-bold" aria-hidden="true">
              –
            </span>
          ) : (
            <span className="font-mono text-2xl font-bold">{ring.centerText}</span>
          )}
        </div>
      </div>
      <figcaption className="mt-3 max-w-sm text-sm font-medium text-neutral-800">
        {ring.caption}
      </figcaption>
      <p className="mt-1 text-xs text-neutral-600">{RING_NOTE}</p>
    </figure>
  );
}
