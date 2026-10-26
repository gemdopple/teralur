import Link from "next/link";
import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { KartuProyekDasbor } from "@/components/teralur/KartuProyekDasbor";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekDemo, type ProyekDemo } from "@/data/proyek-demo";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";

// Daftar seluruh proyek pada dasbor (semua peran). Data simulasi statis;
// proyek draf (terbit=false) diberi lencana khusus karena tidak terlihat publik.

export const instant = false;

function Baris({ proyek }: { proyek: ProyekDemo }) {
  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
      <td className="max-w-80 py-3.5 pr-3" title={proyek.nama}>
        <span className="line-clamp-1 font-medium">{proyek.nama}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {proyek.kategori} · {proyek.kunci}
        </span>
      </td>
      <td className="px-3 py-3.5 text-muted-foreground">{proyek.lokasi}</td>
      <td className="px-3 py-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <ChipStatus status={proyek.status as DossierStatus} />
          {!proyek.terbit && <Badge variant="secondary">Draf</Badge>}
        </div>
      </td>
      <td className="px-3 py-3.5 text-right font-mono text-sm whitespace-nowrap">
        {formatRupiahRingkas(proyek.nilaiKontrak) ?? "—"}
      </td>
      <td className="hidden px-3 py-3.5 text-muted-foreground md:table-cell">
        {proyek.penyedia ?? "—"}
      </td>
      <td className="py-3.5 pl-3 text-right">
        <Link
          href={proyek.href}
          className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Laporan
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
        </Link>
      </td>
    </tr>
  );
}

export default async function HalamanProyekDasbor() {
  await connection();
  const proyek = daftarProyekDemo(jakartaToday());

  return (
    <>
      <KepalaDasbor
        judul="Proyek"
        deskripsi="Seluruh proyek pada wilayah kerja ini, dengan status pencocokan terhadap catatan resmi."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Reveal>
          {/* Ponsel: kartu; layar lebar: tabel (permintaan PM aksesibilitas). */}
          <ul className="grid gap-3 md:hidden">
            {proyek.map((p) => (
              <KartuProyekDasbor key={p.kunci} proyek={p} />
            ))}
          </ul>
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-3 pr-3 pl-5 text-xs font-medium text-muted-foreground">Nama paket</th>
                    <th className="px-3 py-3 text-xs font-medium text-muted-foreground">Lokasi</th>
                    <th className="px-3 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground">Nilai resmi</th>
                    <th className="hidden px-3 py-3 text-xs font-medium text-muted-foreground md:table-cell">Penyedia</th>
                    <th className="py-3 pr-5 pl-3 text-right text-xs font-medium text-muted-foreground">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {proyek.map((baris) => (
                    <Baris key={baris.kunci} proyek={baris} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Proyek draf hanya terlihat di dasbor dan belum terbit di peta publik. Status dihitung
          ulang oleh compare() setiap halaman dibuka.
        </p>
      </div>
    </>
  );
}
