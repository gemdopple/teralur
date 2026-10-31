import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
  ArrowUpRightIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { HeroBeranda } from "@/components/teralur/HeroBeranda";
import { AngkaNaik } from "@/components/teralur/AngkaNaik";
import { LabelTiga } from "@/components/teralur/LabelTiga";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekPublik, dossierDemo } from "@/data/proyek-demo";
import { formatRupiah, formatRupiahRingkas } from "@/lib/format-rupiah";
import { kelasTombol } from "@/lib/kelas-tombol";
import { cn } from "@/lib/utils";

// Beranda — modern SaaS tanpa slop: tipografi dan data nyata sebagai bahan
// utama, dekorasi seminimal mungkin. Tanpa testimoni palsu / harga fiktif —
// konten hanya yang benar-benar ada di produk.

const FITUR = [
  {
    judul: "Pindai, langsung terbaca",
    isi: "Warga memindai QR pada papan proyek dan membuka laporan lengkap tanpa perlu membuat akun.",
    lebar: false,
  },
  {
    judul: "Peta di sekitar Anda",
    isi: "Temukan proyek terdekat dari lokasi Anda, lengkap dengan status pencocokan dan masa pelaksanaan.",
    lebar: false,
  },
  {
    judul: "Laporan warga",
    isi: "Keadaan lapangan dari mata warga: laporan singkat sebagai pemeriksaan kedua atas data resmi.",
    lebar: false,
  },
  {
    judul: "Kartu bukti",
    isi: "Satu kartu ringkas siap dibagikan — pas dilampirkan ke laporan warga atau pesan grup.",
    lebar: false,
  },
  {
    judul: "Dua sumber, satu halaman",
    isi: "Data papan diletakkan berdampingan dengan catatan pengadaan resmi — setiap perbedaan terlihat jelas, lengkap dengan jejak sumber dan tanggal datanya.",
    lebar: true,
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
    judul: "Dossier publik terbit",
    isi: "Setiap proyek mendapat laporan dengan grafik, jejak sumber, dan tanggal data — terbuka tanpa akun.",
  },
  {
    judul: "Warga memantau",
    isi: "Dari peta atau QR papan, warga membaca hasilnya dan mengirim laporan lapangan sebagai pemeriksaan kedua.",
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

const FAQ = [
  {
    tanya: "Dari mana data Teralur berasal?",
    jawab:
      "Dua jalur terpisah: data papan yang dikelola tim Teralur (belum diverifikasi), dan catatan pengadaan resmi dari publikasi OCDS Opentender oleh ICW. Setiap halaman menyebut asal dan tanggal datanya.",
  },
  {
    tanya: "Apakah saya perlu membuat akun?",
    jawab:
      "Tidak. Seluruh laporan publik — peta, dossier, dan kartu bukti — terbuka tanpa akun. Akun hanya diperlukan untuk pengelola: pemerintah, kontraktor, dan admin.",
  },
  {
    tanya: "Apakah data ini real-time?",
    jawab:
      "Bukan. Setiap dossier menampilkan tanggal snapshot-nya; angka yang Anda lihat adalah keadaan pada tanggal tersebut, bukan keadaan hari ini.",
  },
  {
    tanya: "Bagaimana jika saya menemukan kesalahan?",
    jawab:
      "Kirim koreksi lewat email yang tercantum di halaman Metodologi. Setiap laporan juga menyertakan batas datanya, agar pembaca dapat menilai sendiri apa yang sudah dan belum diketahui.",
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
                  "px-5 py-7 first:pl-0",
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
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
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
                <div className="mt-2 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-kuning-papan"
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

      {/* 01 — Fitur: bento kartu; sel lebar menampung pil provenance nyata. */}
      <section aria-label="Fitur" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <Kicker n="01" label="Fitur" />
          <h2 className="text-balance mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Dibuat agar selisih mudah dibaca, bukan disimpulkan sendiri.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FITUR.map((fitur, i) => (
            <Reveal key={fitur.judul} delay={i * 0.05}>
              <article
                className={cn(
                  "flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:bg-muted/40",
                  fitur.lebar && "md:col-span-2",
                )}
              >
                {fitur.lebar ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <LabelTiga label="tercatat" />
                    <LabelTiga label="hitungan" />
                    <LabelTiga label="belum_diketahui" />
                  </span>
                ) : (
                  <span aria-hidden className="font-mono text-xs font-medium text-muted-foreground">
                    0{i + 1}
                  </span>
                )}
                <h3 className="mt-3 font-heading text-base font-semibold tracking-tight">
                  {fitur.judul}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{fitur.isi}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 02 — Cara kerja: empat langkah bernomor dalam kartu. */}
      <section aria-label="Cara kerja" className="border-y border-border bg-card/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <Reveal>
            <Kicker n="02" label="Cara kerja" />
            <h2 className="text-balance mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Empat langkah, dari papan ke laporan.
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LANGKAH.map((langkah, i) => (
              <Reveal key={langkah.judul} delay={i * 0.05}>
                <li className="flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
                  <span aria-hidden className="font-mono text-sm font-medium text-muted-foreground">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 font-heading text-base font-semibold tracking-tight">
                    {langkah.judul}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{langkah.isi}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 03 — Untuk siapa: tiga kartu peran; kartu Warga dibalik (tinta di
          terang, brand kuning di gelap). */}
      <section aria-label="Untuk siapa" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <Reveal>
          <Kicker n="03" label="Untuk siapa" />
          <h2 className="text-balance mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Satu data, tiga sudut pandang.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PERAN.map((peran, i) => (
            <Reveal key={peran.judul} delay={i * 0.05}>
              <article
                className={cn(
                  "flex h-full flex-col rounded-xl border border-transparent p-6 shadow-sm",
                  peran.sorot
                    ? "bg-hitam-aspal text-kertas dark:bg-brand dark:text-hitam-aspal"
                    : "border-border bg-card",
                )}
              >
                <h3 className="font-heading text-lg font-semibold tracking-tight">
                  {peran.judul}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-sm leading-6",
                    peran.sorot
                      ? "text-kertas/75 dark:text-hitam-aspal/75"
                      : "text-muted-foreground",
                  )}
                >
                  {peran.isi}
                </p>
                <Link
                  href={peran.tautan.href}
                  className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold underline-offset-4 hover:underline"
                >
                  {peran.tautan.label}
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 04 — FAQ: elemen details native (tanpa JS), isi dari metodologi. */}
      <section aria-label="Pertanyaan umum" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
            <div>
              <Kicker n="04" label="Pertanyaan umum" />
              <h2 className="text-balance mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Yang paling sering ditanyakan.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Penjelasan lengkap soal asal data, label provenance, dan batasnya ada di halaman{" "}
                <Link href="/methodology" className="font-medium text-foreground underline decoration-kuning-papan decoration-2 underline-offset-4">
                  Metodologi
                </Link>
                .
              </p>
            </div>
            <div className="space-y-3">
              {FAQ.map((item) => (
                <details key={item.tanya} className="group rounded-xl border border-border bg-card">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    {item.tanya}
                    <HugeiconsIcon
                      icon={Add01Icon}
                      className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                    />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-6 text-muted-foreground">{item.jawab}</p>
                </details>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Ajakan: panel tinta dengan pola titik + pijar kuning; tombol gradasi. */}
      <section aria-label="Ajakan" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-2xl bg-hitam-aspal px-6 py-12 text-kertas sm:px-10 dark:border dark:border-border dark:bg-card"
            style={{ "--grid-garis": "rgb(246 242 232 / 9%)" } as React.CSSProperties}
          >
            <div aria-hidden className="absolute inset-0 bg-dots" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <h2 className="text-balance font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                  Berada di dekat proyek? Mulai dari peta.
                </h2>
                <p className="mt-3 text-sm leading-6 text-kertas/70 dark:text-muted-foreground">
                  Cari proyek di sekitar lokasi Anda, baca laporannya, dan kirim laporan warga bila
                  Anda melihat kegiatannya secara langsung.
                </p>
              </div>
              <Link href="/jelajah" className={cn(kelasTombol("brand", "lg"), "shrink-0")}>
                Buka peta proyek
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
