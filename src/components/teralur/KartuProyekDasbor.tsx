import Link from "next/link";
import { ChipStatusRingkas, type DossierStatus } from "@/components/teralur/ChipStatus";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import type { ProyekPublik } from "@/data/proyek-demo";
import { formatRupiahRingkas } from "@/lib/format-rupiah";

// Kartu proyek dasbor untuk ponsel (permintaan PM: tabel dasbor harus tetap
// terbaca di ponsel). Dipakai menggantikan tabel di bawah breakpoint md pada
// halaman ringkasan dan daftar proyek; tabel penuh tetap di layar lebar.

export function KartuProyekDasbor({
  proyek,
  tautanPapan,
}: {
  proyek: ProyekPublik;
  /** Bila diisi (peran kontraktor), tampilkan tautan ke lembar papan proyek. */
  tautanPapan?: string;
}) {
  return (
    <li className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug tracking-tight">
            {proyek.nama}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {proyek.kategori} · {proyek.kunci}
          </p>
        </div>
        <Link
          href={proyek.href}
          aria-label={`Buka laporan ${proyek.nama}`}
          className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-hitam-aspal hover:text-kertas"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
        </Link>
      </div>
      <div className="mt-2.5">
        <ChipStatusRingkas status={proyek.status as DossierStatus} />
      </div>
      <dl className="mt-3 space-y-1.5 border-t border-border pt-2.5 text-xs">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">Lokasi</dt>
          <dd className="text-right font-medium">{proyek.lokasi}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">Nilai resmi</dt>
          <dd className="text-right font-semibold">
            {formatRupiahRingkas(proyek.nilaiKontrak ?? proyek.nilaiPapan) ?? "—"}
          </dd>
        </div>
        {proyek.penyedia && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">Penyedia</dt>
            <dd className="text-right font-medium">{proyek.penyedia}</dd>
          </div>
        )}
      </dl>
      {tautanPapan && (
        <Link
          href={tautanPapan}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted"
        >
          <HugeiconsIcon icon={PrinterIcon} className="size-3.5" />
          Buat papan proyek
        </Link>
      )}
    </li>
  );
}
