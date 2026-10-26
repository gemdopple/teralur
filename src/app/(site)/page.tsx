import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/teralur/anim/Stagger";
import { HeroBeranda } from "@/components/teralur/HeroBeranda";
import { AngkaNaik } from "@/components/teralur/AngkaNaik";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekPublik, dossierDemo } from "@/data/proyek-demo";
import { formatRupiah, formatRupiahRingkas } from "@/lib/format-rupiah";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Location01Icon,
  ArrowRight01Icon,
  ArrowUpRightIcon,
  ScanIcon,
  File01Icon,
  MapIcon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons";

// Beranda — gaya SaaS bersih: hero berpijar dengan kartu laporan tiruan,
// strip statistik mono, grid fitur 2x2, tiga langkah cara kerja, kartu
// unggulan, blok peran (Warga = kartu tinta), dan pita CTA bertinta.
// Data unggulan memakai salinan statis hero (mode cadangan tanpa basis data);
// status selalu dihitung compare() saat render.

const FITUR = [
  {
    ikon: ScanIcon,
    judul: "Pindai, langsung terbaca",
    isi: "Warga memindai QR pada papan proyek dan membuka laporan lengkap tanpa perlu membuat akun.",
  },
  {
    ikon: File01Icon,
    judul: "Dua sumber, satu halaman",
    isi: "Data papan diletakkan berdampingan dengan catatan pengadaan resmi — setiap perbedaan terlihat jelas.",
  },
  {
    ikon: MapIcon,
    judul: "Peta di sekitar Anda",
    isi: "Temukan proyek terdekat dari lokasi Anda, lengkap dengan status pencocokan dan masa pelaksanaan.",
  },
  {
    ikon: ShieldUserIcon,
    judul: "Sumber dan batas terbuka",
    isi: "Setiap angka membawa jejak sumber, tanggal data, dan catatan batas — pembaca menilai sendiri.",
  },
] as const;

const LANGKAH = [
  {
    nomor: "01",
    judul: "Data masuk dua jalur",
    isi: "Pengelola mencatat data papan proyek; catatan resmi diambil dari data pengadaan publik.",
  },
  {
    nomor: "02",
    judul: "Sistem membandingkan",
    isi: "Nama paket, penyedia, dan nilai kontrak diperiksa otomatis — kecocokan dan selisih diberi status yang mudah dibaca.",
  },
  {
    nomor: "03",
    judul: "Warga membaca hasilnya",
    isi: "Laporan tampil dengan grafik dan bahasa sederhana, plus laporan warga sebagai pemeriksaan kedua dari lapangan.",
  },
] as const;

// Kicker seksi: titik kuning kecil + label tenang, dipakai semua seksi.
function Kicker({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
      {label}
    </p>
  );
}

// Blok dinamis beranda: angka ringkasan + proyek unggulan. Keduanya bergantung
// tanggal hari ini (WIB) dan compare(), sehingga dihitung per-permintaan di
// dalam pulau Suspense — cangkang halaman tetap statis dan instan.
async function BlokDinamis() {
  await connection();
  const hariIni = jakartaToday();
  const proyek = daftarProyekPublik(hariIni);
  const unggulan = ["demo-001", "demo-002", "demo-004"]
    .map((kunci) => dossierDemo(kunci, hariIni))
    .filter((item) => item !== null);

  const totalNilai = proyek.reduce((jumlah, item) => jumlah + (item.nilaiKontrak ?? 0), 0);
  const terpantau = proyek.filter((item) => item.status === "cocok").length;
  const selisih = proyek.filter((item) => item.status === "selisih").length;

  const statistik: Array<[label: string, nilai: string]> = [
    ["Proyek terpantau", String(proyek.length)],
    ["Kecocokan penuh", String(terpantau)],
    ["Perlu klarifikasi", String(selisih)],
    ["Nilai dibandingkan", formatRupiahRingkas(totalNilai) ?? "—"],
  ];

  return (
    <>
      <section aria-label="Ringkasan angka" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <StaggerGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statistik.map(([label, nilai]) => (
            <StaggerItem key={label} className="h-full">
              <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-sm">
                <dl>
                  <dd className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    <AngkaNaik nilai={nilai} />
                  </dd>
                  <dt className="mt-2 text-sm text-muted-foreground">{label}</dt>
                </dl>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      <section
        aria-label="Proyek unggulan"
        className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
      >
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <Kicker label="Proyek unggulan" />
              <h2 className="text-balance mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Contoh laporan yang selalu terbuka.
              </h2>
            </div>
            <Link
              href="/examples"
              className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Semua contoh kasus
              <HugeiconsIcon icon={ArrowUpRightIcon} className="size-4" />
            </Link>
          </div>
        </Reveal>
        <StaggerGroup className="mt-10 grid gap-4 md:grid-cols-3">
          {unggulan.map((dossier) => (
            <StaggerItem key={dossier.exampleId} className="h-full">
              <Link
                href={`/examples/${dossier.exampleId}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="font-heading text-base font-semibold leading-snug tracking-tight">
                  {dossier.packageName}
                </h3>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <HugeiconsIcon icon={Location01Icon} className="size-4 shrink-0" />
                  {dossier.board.locationText ?? "Lokasi belum diketahui"}
                </p>
                <div className="mt-auto pt-5">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">Nilai kontrak</span>
                    <span className="font-mono font-medium">
                      {formatRupiah(dossier.record.contractValue)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {dossier.timeRing.caption}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-hitam-aspal"
                      style={{ width: `${Math.round(dossier.timeRing.fillRatio * 100)}%` }}
                    />
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>
    </>
  );
}

function KerangkaDinamis() {
  return (
    <div
      aria-hidden
      className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((indeks) => (
          <div
            key={indeks}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <Skeleton className="h-8 w-24" />
            <Skeleton className="mt-3 h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HalamanUtama() {
  return (
    <div className="flex-1">
      {/* Hero: latar pijar + grid titik, garis waktu GSAP di HeroBeranda */}
      <HeroBeranda />

      {/* Angka + unggulan: bergantung tanggal hari ini (WIB) — pulau dinamis
          di dalam cangkang statis, mengalir via Suspense (Cache Components). */}
      <Suspense fallback={<KerangkaDinamis />}>
        <BlokDinamis />
      </Suspense>

      {/* Fitur: grid kartu 2x2 dengan ikon Hugeicons */}
      <section aria-label="Fitur" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="max-w-2xl">
            <Kicker label="Fitur" />
            <h2 className="text-balance mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Dibuat agar selisih mudah dibaca, bukan disimpulkan sendiri.
            </h2>
          </div>
        </Reveal>
        <StaggerGroup className="mt-10 grid gap-4 sm:grid-cols-2">
          {FITUR.map((fitur) => (
            <StaggerItem key={fitur.judul} className="h-full">
              <article className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md sm:p-8">
                <span className="flex size-11 items-center justify-center rounded-xl bg-kuning-papan/20 text-hitam-aspal">
                  <HugeiconsIcon icon={fitur.ikon} className="size-5" />
                </span>
                <h3 className="mt-5 font-heading text-lg font-semibold tracking-tight">
                  {fitur.judul}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{fitur.isi}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Cara kerja: tiga langkah dalam kartu */}
      <section aria-label="Cara kerja" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="max-w-2xl">
            <Kicker label="Cara kerja" />
            <h2 className="text-balance mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Tiga langkah, dari papan ke laporan.
            </h2>
          </div>
        </Reveal>
        <StaggerGroup className="mt-10 grid gap-4 md:grid-cols-3">
          {LANGKAH.map((langkah) => (
            <StaggerItem key={langkah.nomor} className="h-full">
              <article className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
                  {langkah.nomor}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight">
                  {langkah.judul}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{langkah.isi}</p>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Peran: kartu tinta untuk warga, kartu putih untuk lainnya */}
      <section aria-label="Untuk siapa" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="max-w-2xl">
            <Kicker label="Untuk siapa" />
            <h2 className="text-balance mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Satu data, tiga sudut pandang.
            </h2>
          </div>
        </Reveal>
        <StaggerGroup className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              judul: "Warga",
              isi: "Pindai QR atau cari proyek terdekat dari lokasi Anda. Laporan lengkap terbuka tanpa akun.",
              tautan: { href: "/jelajah", label: "Buka peta publik" },
              sorot: true,
            },
            {
              judul: "Pemerintah",
              isi: "Pantau seluruh proyek daerah, daftar selisih yang perlu klarifikasi, dan laporan warga.",
              tautan: { href: "/login", label: "Masuk dasbor pemerintah" },
            },
            {
              judul: "Kontraktor",
              isi: "Proyek Anda dalam satu pandangan: masa pelaksanaan, nilai kontrak, dan kelengkapan data.",
              tautan: { href: "/login", label: "Masuk dasbor kontraktor" },
            },
          ].map((kartu) => (
            <StaggerItem key={kartu.judul} className="h-full">
              <article
                className={`h-full rounded-2xl border p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${
                  kartu.sorot ? "border-hitam-aspal bg-hitam-aspal text-kertas" : "border-border bg-card"
                }`}
              >
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  {kartu.judul}
                </h3>
                <p
                  className={`mt-2 text-sm leading-6 ${
                    kartu.sorot ? "text-kertas/75" : "text-muted-foreground"
                  }`}
                >
                  {kartu.isi}
                </p>
                <Link
                  href={kartu.tautan.href}
                  className={`mt-5 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline ${
                    kartu.sorot ? "text-kertas" : ""
                  }`}
                >
                  {kartu.tautan.label}
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </Link>
              </article>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* CTA: pita bertinta dengan aksen kuning */}
      <section aria-label="Ajakan" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-hitam-aspal px-6 py-14 text-center sm:px-12 sm:py-16">
            <div
              aria-hidden
              className="absolute inset-0 [background-image:radial-gradient(rgb(255_255_255/7%)_1px,transparent_1px)] [background-size:22px_22px]"
            />
            <div
              aria-hidden
              className="absolute -top-24 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-kuning-papan/25 blur-3xl"
            />
            <div className="relative">
              <h2 className="text-balance mx-auto max-w-2xl font-heading text-3xl font-bold tracking-tight text-kertas sm:text-4xl">
                Berada di dekat proyek? Mulai dari peta.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-kertas/70 sm:text-base sm:leading-7">
                Cari proyek di sekitar lokasi Anda, baca laporannya, dan kirim laporan warga bila
                Anda melihat kegiatannya secara langsung.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/jelajah"
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-kuning-papan px-6 text-sm font-semibold text-hitam-aspal transition-all hover:bg-kuning-papan/90 active:translate-y-px"
                >
                  Buka peta proyek
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
