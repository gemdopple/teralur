import type { CSSProperties } from "react";
import type { Cincin as DataCincin, TimeRing } from "@/lib/cincin";
import { RING_NOTE } from "@/lib/cincin";
import { LabelTiga } from "@/components/teralur/LabelTiga";

export type CincinProps = {
  data: DataCincin;
  className?: string;
};

// Cincin progres: lintasan netral (dari token agar terbaca di kedua tema),
// isi kuning papan (var(--kuning-papan)), oranye (var(--selisih)) bila
// melewati. Ujung isi membulat.
// Isi tumbuh (draw-in) lewat keyframes CSS murni di dalam komponen — tanpa
// "use client" — dan berhenti total bila pengguna memilih gerak berkurang.
const GAYA_CINCIN = `
@keyframes teralur-cincin-draw {
  from { stroke-dashoffset: var(--cincin-dari); }
  to { stroke-dashoffset: var(--cincin-ke); }
}
.teralur-cincin-isi {
  animation: teralur-cincin-draw 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  .teralur-cincin-isi { animation: none; }
}`;

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
      <style>{GAYA_CINCIN}</style>
      <LabelTiga label={unknown ? "belum_diketahui" : "hitungan"} />
      <div className="relative mt-2 h-40 w-40">
        <svg viewBox="0 0 100 100" role="img" aria-label={description} className="h-full w-full -rotate-90">
          {/* Lintasan netral dari token; isi kuning papan, oranye bila melewati. */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="color-mix(in oklab, var(--muted-foreground) 25%, transparent)"
            strokeWidth="9"
          />
          {!unknown && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={data.keadaan === "melewati" ? "var(--selisih)" : "var(--kuning-papan)"}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="teralur-cincin-isi"
              style={{ "--cincin-dari": circumference, "--cincin-ke": dashOffset } as CSSProperties}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {unknown ? (
            <span className="max-w-24 text-sm font-semibold">Belum tersedia</span>
          ) : (
            <>
              <span className="font-mono text-2xl font-bold">{Math.max(0, data.berjalan ?? 0)}</span>
              <span className="font-mono text-sm text-muted-foreground">dari {data.total} hari</span>
            </>
          )}
        </div>
      </div>
      <figcaption className="mt-3 max-w-sm text-sm text-muted-foreground">{description}</figcaption>
      <p className="mt-1 text-xs text-muted-foreground">Ini waktu yang telah berjalan, bukan kemajuan fisik.</p>
    </figure>
  );
}

// Cincin waktu G.1 (PRD v1.1, E.11 `timeRing`): menerima hasil computeTimeRing
// dari server (empat keadaan: running | over | unknown | not_started) dan
// merender caption baku G.1 apa adanya. Catatan tetap RING_NOTE selalu tampil
// di bawah cincin, apa pun keadaannya (G.1). Draw-in lengkungnya disediakan
// pembungkus klien cincin-anim.tsx (anime.js) — di sini sengaja statis agar
// tidak beranimasi ganda.
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
          {/* Lintasan netral dari token; isi kuning papan, var(--selisih) bila over. */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="color-mix(in oklab, var(--muted-foreground) 25%, transparent)"
            strokeWidth="9"
          />
          {!takTerhitung && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={ring.state === "over" ? "var(--selisih)" : "var(--kuning-papan)"}
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
      <figcaption className="mt-3 max-w-sm text-sm font-medium text-foreground">
        {ring.caption}
      </figcaption>
      <p className="mt-1 text-xs text-muted-foreground">{RING_NOTE}</p>
    </figure>
  );
}
