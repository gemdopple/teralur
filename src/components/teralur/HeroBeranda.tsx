import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { ChipStatus } from "@/components/teralur/ChipStatus";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { kelasTombol } from "@/lib/kelas-tombol";
import { formatRupiah } from "@/lib/format-rupiah";
import { HERO_SPECS } from "@/data/hero-dossiers";

// Hero beranda: tipografi + satu dokumen perbandingan NYATA (salinan statis
// demo-002 dari data/hero-dossiers.ts — nilai papan Rp 875 jt vs catatan resmi
// Rp 912,5 jt). Tanpa pijar, tanpa grid titik, tanpa kartu mock berisi angka
// karangan — dokumen di kanan adalah bentuk paling jujur dari produk: dua
// sumber, disandingkan, selisih terlihat.
//
// Server component: datanya statis (tanpa tanggal hari ini), animasi masuk
// memakai .animate-reveal (CSS murni) — gsap tidak diperlukan di sini lagi.

// Ambil spesifikasi demo-002 (satu-satunya unggulan dengan selisih nilai).
const SPESIFIKASI = HERO_SPECS.find((s) => s.exampleId === "demo-002") ?? HERO_SPECS[0];
const selisihRp = (SPESIFIKASI.official.contractValue ?? 0) - (SPESIFIKASI.board.contractValue ?? 0);
const selisihPersen = ((selisihRp / (SPESIFIKASI.official.contractValue || 1)) * 100)
  .toFixed(1)
  .replace(".", ",");

export function HeroBeranda() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_26rem] lg:gap-16">
        <div className="max-w-xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Transparansi proyek publik
          </p>
          <h1 className="text-balance mt-5 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Papan proyek yang bisa{" "}
            <span className="underline decoration-kuning-papan decoration-[3px] underline-offset-8">
              diperiksa siapa pun.
            </span>
          </h1>
          <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Teralur membandingkan informasi di papan proyek dengan catatan pengadaan resmi,
            lalu menyajikannya sebagai laporan sederhana — lengkap dengan sumber, tanggal
            data, dan batasnya.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/jelajah" className={kelasTombol("default", "lg")}>
              Cari proyek di sekitar saya
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </Link>
            <Link href="/examples" className={kelasTombol("outline", "lg")}>
              Lihat contoh laporan
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Tanpa akun untuk warga · Data terbuka dengan sumber jelas
          </p>
        </div>

        <Reveal delay={0.1}>
          <DokumenPerbandingan />
        </Reveal>
      </div>
    </section>
  );
}

// DokumenPerbandingan: potongan laporan sesungguhnya — bukan mock. Angka dari
// salinan statis seed (HERO_SPECS), format dan status mengikuti komponen
// produksi (formatRupiah, ChipStatus).
function DokumenPerbandingan() {
  const { board, official } = SPESIFIKASI;

  return (
    <figure className="rounded-lg border border-border bg-card">
      <figcaption className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Contoh perbandingan
        </span>
        <Link
          href={`/examples/${SPESIFIKASI.exampleId}`}
          className="text-xs font-semibold underline decoration-kuning-papan decoration-2 underline-offset-4 hover:text-foreground"
        >
          {SPESIFIKASI.exampleId}
        </Link>
      </figcaption>

      <div className="px-5 pt-4">
        <h2 className="font-heading text-sm font-semibold leading-snug tracking-tight">
          {official.packageName}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{SPESIFIKASI.lokasi}</p>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-y border-border text-left">
            <th scope="col" className="py-2 pl-5 pr-3 text-xs font-medium text-muted-foreground">Kolom</th>
            <th scope="col" className="px-3 py-2 text-xs font-medium text-muted-foreground">Papan</th>
            <th scope="col" className="py-2 pl-3 pr-5 text-xs font-medium text-muted-foreground">Catatan resmi</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <th scope="row" className="py-3 pl-5 pr-3 text-left align-top text-xs font-medium text-muted-foreground">Penyedia</th>
            <td className="px-3 py-3 text-[13px] leading-5">{board.supplier}</td>
            <td className="py-3 pl-3 pr-5 text-[13px] leading-5">{official.supplier}</td>
          </tr>
          <tr className="border-b border-border">
            <th scope="row" className="py-3 pl-5 pr-3 text-left align-top text-xs font-medium text-muted-foreground">Nilai kontrak</th>
            <td className="px-3 py-3 text-[13px] tabular-nums">{formatRupiah(board.contractValue)}</td>
            <td className="py-3 pl-3 pr-5 text-[13px] tabular-nums">{formatRupiah(official.contractValue)}</td>
          </tr>
          <tr>
            <th scope="row" className="py-3 pl-5 pr-3 text-left align-top text-xs font-medium text-muted-foreground">Masa pelaksanaan</th>
            <td className="px-3 py-3 text-[13px] tabular-nums">{board.durationDays} hari</td>
            <td className="py-3 pl-3 pr-5 text-[13px] tabular-nums">{official.durationDays} hari</td>
          </tr>
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3.5">
        <ChipStatus status="selisih" />
        <p className="text-xs text-muted-foreground">
          Selisih{" "}
          <span className="font-medium text-selisih-teks tabular-nums">
            Rp {selisihRp.toLocaleString("id-ID")} ({selisihPersen}%)
          </span>
        </p>
      </div>
    </figure>
  );
}
