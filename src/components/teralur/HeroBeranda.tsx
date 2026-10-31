import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { ChipStatus } from "@/components/teralur/ChipStatus";
import { CincinWaktu } from "@/components/teralur/Cincin";
import { kelasTombol } from "@/lib/kelas-tombol";
import { formatRupiah } from "@/lib/format-rupiah";
import { qrSvgDari } from "@/lib/qr";
import { HERO_SPECS, heroDossier } from "@/data/hero-dossiers";

// Hero beranda — modern SaaS tanpa slop: rata kiri, aksen garis bawah kuning
// (bukan teks gradasi), latar grid halus TANPA pijar. Visual di bawahnya
// bukan mock: ketiga sel memakai komponen produksi dengan data nyata.
//   1. Tabel perbandingan demo-002 (salinan statis data/hero-dossiers.ts).
//   2. Cincin waktu sungguhan (CincinWaktu) — offset salinan statis membuat
//      keadaannya selalu sama pada hari apa pun, sama dengan halaman example.
//   3. QR asli (paket qrcode) menuju contoh dossier.
//
// Server component + async: QR dirender saat render lewat paket qrcode.
// Sengaja TIDAK memakai basisSitus() (headers) supaya cangkang halaman tetap
// statis; URL hanya dari NEXT_PUBLIC_SITE_URL dengan cadangan localhost.

// Ambil spesifikasi demo-002 (satu-satunya unggulan dengan selisih nilai).
const SPESIFIKASI = HERO_SPECS.find((s) => s.exampleId === "demo-002") ?? HERO_SPECS[0];
const selisihRp = (SPESIFIKASI.official.contractValue ?? 0) - (SPESIFIKASI.board.contractValue ?? 0);
const selisihPersen = ((selisihRp / (SPESIFIKASI.official.contractValue || 1)) * 100)
  .toFixed(1)
  .replace(".", ",");

// Tanggal acuan bebas: karena tanggal kontrak salinan statis dihitung dari
// offset terhadap tanggal yang sama, keadaan cincinnya invarian terhadap
// tanggal ini — hasilnya identik dengan hitungan live di /examples/demo-002.
const TANGGAL_ACUAN_CINCIN = "2026-01-01";

export async function HeroBeranda() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const qr = await qrSvgDari(`${siteUrl}/examples/${SPESIFIKASI.exampleId}`);
  const { timeRing } = heroDossier(SPESIFIKASI, TANGGAL_ACUAN_CINCIN);

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Latar: grid halus memudar ke bawah — satu-satunya dekorasi hero. */}
      <div aria-hidden className="absolute inset-0 bg-grid mask-pudar-bawah" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-medium text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
            Terhubung catatan pengadaan publik (OCDS)
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
            <Link href="/jelajah" className={kelasTombol("brand", "lg")}>
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

        <HeroBento qr={qr} ring={timeRing} />
      </div>
    </section>
  );
}

// Bento hero: tabel perbandingan lebar di kiri, kolom kanan berisi cincin
// waktu dan QR — semuanya komponen produksi, tanpa sel dekoratif.
function HeroBento({ qr, ring }: { qr: string; ring: Parameters<typeof CincinWaktu>[0]["ring"] }) {
  const { board, official } = SPESIFIKASI;

  return (
    <div className="mx-auto mt-12 grid max-w-5xl gap-3 sm:mt-16 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
      {/* 1 — Tabel perbandingan (data nyata demo-002) */}
      <figure className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6 lg:row-span-2">
        <figcaption className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Dua sumber, disandingkan
          </span>
          <Link
            href={`/examples/${SPESIFIKASI.exampleId}`}
            className="font-mono text-xs font-semibold text-foreground underline decoration-kuning-papan decoration-2 underline-offset-4"
          >
            {SPESIFIKASI.exampleId}
          </Link>
        </figcaption>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="py-2 pr-3 text-xs font-medium text-muted-foreground">Kolom</th>
              <th scope="col" className="px-3 py-2 text-xs font-medium text-muted-foreground">Papan</th>
              <th scope="col" className="py-2 pl-3 text-right text-xs font-medium text-muted-foreground sm:text-left">
                Catatan resmi
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <th scope="row" className="py-2.5 pr-3 text-left align-top text-xs font-medium text-muted-foreground">
                Penyedia
              </th>
              <td className="px-3 py-2.5">{board.supplier}</td>
              <td className="py-2.5 pl-3 text-right sm:text-left">{official.supplier}</td>
            </tr>
            <tr className="border-b border-border">
              <th scope="row" className="py-2.5 pr-3 text-left align-top text-xs font-medium text-muted-foreground">
                Nilai kontrak
              </th>
              <td className="px-3 py-2.5 tabular-nums">{formatRupiah(board.contractValue)}</td>
              <td className="py-2.5 pl-3 text-right tabular-nums sm:text-left">
                {formatRupiah(official.contractValue)}
              </td>
            </tr>
            <tr>
              <th scope="row" className="py-2.5 pr-3 text-left align-top text-xs font-medium text-muted-foreground">
                Masa pelaksanaan
              </th>
              <td className="px-3 py-2.5 tabular-nums">{board.durationDays} hari</td>
              <td className="py-2.5 pl-3 text-right tabular-nums sm:text-left">{official.durationDays} hari</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <ChipStatus status="selisih" />
          <p className="text-xs text-muted-foreground">
            Selisih{" "}
            <span className="font-medium text-selisih-teks tabular-nums">
              Rp {selisihRp.toLocaleString("id-ID")} ({selisihPersen}%)
            </span>
          </p>
        </div>
      </figure>

      {/* 2 — Cincin waktu: komponen produksi, data salinan statis demo-002 */}
      <div className="flex items-center justify-center rounded-xl border border-border bg-card px-5 py-6 shadow-sm">
        <CincinWaktu ring={ring} />
      </div>

      {/* 3 — QR papan (QR sungguhan menuju contoh dossier) */}
      <figure className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          QR papan proyek
        </span>
        <div
          aria-hidden
          className="mx-auto mt-3 w-28 rounded-lg border border-border bg-white p-2.5 [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qr }}
        />
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">
          Warga memindai QR di papan — laporan terbuka tanpa akun.
        </figcaption>
      </figure>
    </div>
  );
}
