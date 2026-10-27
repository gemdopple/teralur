import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { HeroBeranda } from "@/components/teralur/HeroBeranda";
import { AngkaNaik } from "@/components/teralur/AngkaNaik";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekPublik, dossierDemo } from "@/data/proyek-demo";
import { formatRupiah, formatRupiahRingkas } from "@/lib/format-rupiah";
import { HugeiconsIcon } from "@hugeicons/react";
import { Location01Icon, ArrowRight01Icon, ArrowUpRightIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// Beranda — bahasa dokumen kelembagaan: kertas datar, garis rambut, penomoran
// seksi, angka dari data nyata. Tanpa pijar/grid titik/kartu mock. Data
// unggulan memakai salinan statis hero (mode cadangan tanpa basis data);
// status selalu dihitung compare() saat render.

const FITUR = [
  {
    judul: "Pindai, langsung terbaca",
    isi: "Warga memindai QR pada papan proyek dan membuka laporan lengkap tanpa perlu membuat akun.",
  },
  {
    judul: "Dua sumber, satu halaman",
    isi: "Data papan diletakkan berdampingan dengan catatan pengadaan resmi — setiap perbedaan terlihat jelas.",
  },
  {
    judul: "Peta di sekitar Anda",
    isi: "Temukan proyek terdekat dari lokasi Anda, lengkap dengan status pencocokan dan masa pelaksanaan.",
  },
  {
    judul: "Sumber dan batas terbuka",
    isi: "Setiap angka membawa jejak sumber, tanggal data, dan catatan batas — pembaca menilai sendiri.",
  },
] as const;

const LANGKAH = [
  {
    judul: "Data masuk dua jalur",
    isi: "Pengelola mencatat data papan proyek; catatan resmi diambil dari data pengadaan publik.",
  },
  {
    judul: "Sistem membandingkan",
    isi: "Nama paket, penyedia, dan nilai kontrak diperiksa otomatis — kecocokan dan selisih diberi status yang mudah dibaca.",
  },
  {
    judul: "Warga membaca hasilnya",
    isi: "Laporan tampil dengan grafik dan bahasa sederhana, plus laporan warga sebagai pemeriksaan kedua dari lapangan.",
  },
] as const;

const PERAN = [
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
    sorot: false,
  },
  {
    judul: "Kontraktor",
    isi: "Proyek Anda dalam satu pandangan: masa pelaksanaan, nilai kontrak, dan kelengkapan data.",
    tautan: { href: "/login", label: "Masuk dasbor kontraktor" },
    sorot: false,
  },
] as const;

// Kicker seksi: nomor + garis pendek + label, mono huruf besar — bahasa yang
// sama dengan halaman metodologi ("Bagian 01").
function Kicker({ n, label }: { n?: string; label: string }) {
  return (
    <p className="flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {n && <span>{n}</span>}
      {n && <span aria-hidden className="h-px w-8 bg-foreground/25" />}
      <span>{label}</span>
    </p>
  );
}

// Blok dinamis beranda: pita angka + proyek unggulan. Keduanya bergantung
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
      {/* Pita angka: satu garis, empat angka, pemisah rambut — bukan kartu. */}
      <section aria-label="Ringkasan angka" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {statistik.map(([label, nilai], i) => (
              <div
                key={label}
                className={cn(
                  "px-5 py-6 first:pl-0",
                  i > 0 && "lg:border-l lg:border-border",
                  i % 2 === 1 && "max-lg:border-l max-lg:border-border",
                  i > 1 && "max-lg:border-t max-lg:border-border",
                )}
              >
                <dd className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  <AngkaNaik nilai={nilai} />
                </dd>
                <dt className="mt-2 text-sm text-muted-foreground">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-label="Proyek unggulan" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
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
        <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3">
          {unggulan.map((dossier) => (
            <Link
              key={dossier.exampleId}
              href={`/examples/${dossier.exampleId}`}
              className="group flex flex-col bg-card p-6 transition-colors hover:bg-muted/40"
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
                  <span className="font-mono font-medium tabular-nums">
                    {formatRupiah(dossier.record.contractValue)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{dossier.timeRing.caption}</p>
                <div className="mt-2 h-1.5 bg-muted">
                  <div
                    className="h-full bg-hitam-aspal"
                    style={{ width: `${Math.round(dossier.timeRing.fillRatio * 100)}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function KerangkaDinamis() {
  return (
    <div aria-hidden className="border-b border-border">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((indeks) => (
            <div key={indeks} className="px-5 py-6">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-3 h-4 w-32" />
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default function HalamanUtama() {
  return (
    <div className="flex-1">
      <HeroBeranda />

      {/* Angka + unggulan: bergantung tanggal hari ini (WIB) — pulau dinamis
          di dalam cangkang statis, mengalir via Suspense (Cache Components). */}
      <Suspense fallback={<KerangkaDinamis />}>
        <BlokDinamis />
      </Suspense>

      {/* 01 — Fitur: baris bernomor dengan garis rambut, tanpa kartu ikon. */}
      <section aria-label="Fitur" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <Kicker n="01" label="Fitur" />
          <h2 className="text-balance mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Dibuat agar selisih mudah dibaca, bukan disimpulkan sendiri.
          </h2>
        </Reveal>
        <ul className="mt-10 border-t border-border">
          {FITUR.map((fitur, i) => (
            <li
              key={fitur.judul}
              className="grid gap-2 border-b border-border py-6 sm:grid-cols-[4rem_16rem_1fr] sm:gap-6 sm:py-7"
            >
              <span aria-hidden className="font-mono text-sm text-muted-foreground">
                0{i + 1}
              </span>
              <h3 className="font-heading text-base font-semibold tracking-tight">{fitur.judul}</h3>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">{fitur.isi}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 02 — Cara kerja: tiga kolom dipisah garis rambut. */}
      <section aria-label="Cara kerja" className="border-y border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <Kicker n="02" label="Cara kerja" />
            <h2 className="text-balance mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Tiga langkah, dari papan ke laporan.
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0">
            {LANGKAH.map((langkah, i) => (
              <li
                key={langkah.judul}
                className={cn(
                  "md:py-2",
                  i > 0 && "md:border-l md:border-border md:pl-8",
                  i < LANGKAH.length - 1 && "md:pr-8",
                )}
              >
                <span aria-hidden className="font-mono text-sm text-muted-foreground">
                  0{i + 1}
                </span>
                <h3 className="mt-2 font-heading text-lg font-semibold tracking-tight">
                  {langkah.judul}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{langkah.isi}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 03 — Untuk siapa: tabel tiga kolom dengan pemisah 1px; kolom Warga
          dibalik tinta. */}
      <section aria-label="Untuk siapa" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <Kicker n="03" label="Untuk siapa" />
          <h2 className="text-balance mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Satu data, tiga sudut pandang.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3">
          {PERAN.map((peran) => (
            <article
              key={peran.judul}
              className={cn("flex flex-col p-6", peran.sorot ? "bg-hitam-aspal text-kertas" : "bg-card")}
            >
              <h3 className="font-heading text-lg font-semibold tracking-tight">{peran.judul}</h3>
              <p
                className={cn(
                  "mt-2 text-sm leading-6",
                  peran.sorot ? "text-kertas/75" : "text-muted-foreground",
                )}
              >
                {peran.isi}
              </p>
              <Link
                href={peran.tautan.href}
                className={cn(
                  "mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold underline-offset-4 hover:underline",
                  peran.sorot && "text-kertas",
                )}
              >
                {peran.tautan.label}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Ajakan: blok tinta datar, rata kiri, tombol kuning — tanpa dekorasi. */}
      <section aria-label="Ajakan" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <Reveal>
          <div className="flex flex-col gap-6 bg-hitam-aspal px-6 py-10 text-kertas sm:px-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-balance font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                Berada di dekat proyek? Mulai dari peta.
              </h2>
              <p className="mt-3 text-sm leading-6 text-kertas/70">
                Cari proyek di sekitar lokasi Anda, baca laporannya, dan kirim laporan warga bila
                Anda melihat kegiatannya secara langsung.
              </p>
            </div>
            <Link
              href="/jelajah"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-kuning-papan px-6 text-sm font-semibold text-hitam-aspal transition-colors hover:bg-kuning-papan/85 active:translate-y-px"
            >
              Buka peta proyek
              <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
