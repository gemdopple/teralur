import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { daftarProyekPublik, type ProyekDemo } from "@/data/proyek-demo";
import { storedBoardSchema } from "@/lib/api-contract";
import { jakartaToday } from "@/lib/dates";
import { databaseConfigured } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRightIcon } from "@hugeicons/core-free-icons";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/teralur/anim/Stagger";

// Galeri contoh kasus (7.5, F-13/Alur C): proyek unggulan aktif dari basis
// data ditautkan ke dossier hidup /dossiers/[slug]; di bawahnya salinan statis
// seluruh proyek seed (T-28 mode cadangan, diperluas) yang terbuka
// tanpa koneksi dan tanpa API (N.2 butir 11). Halaman contoh warisan v1.0
// (contoh-*) tetap dapat dibuka lewat tautan lama tetapi tidak didaftar.

export const metadata: Metadata = { title: "Contoh Kasus | Teralur" };

// Daftar unggulan harus segar saat demo (proyek baru langsung tampil
// tampil). Kebutuhan itu ditangani oleh <Suspense> di DaftarContoh, bukan lagi
// dengan menghentikan seluruh halaman (instant = false).

type Unggulan = { slug: string; nama: string; status: DossierStatus };

async function ambilUnggulan(): Promise<Unggulan[]> {
  if (!databaseConfigured()) return [];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("submissions")
      .select("slug, status, papan, records!record_id(nama_paket)")
      .eq("jenis", "admin")
      .eq("dinonaktifkan", false)
      .eq("unggulan", true)
      .limit(3);
    if (error) throw new Error(error.message);
    return (data ?? []).flatMap((row: {
      slug: unknown;
      status: unknown;
      papan: unknown;
      records: unknown;
    }) => {
      const status = row.status;
      if (
        typeof row.slug !== "string" ||
        (status !== "cocok" && status !== "selisih" && status !== "tidak_ditemukan")
      ) {
        return [];
      }
      // Nama paket dari papan; fallback nama catatan resmi.
      const papan = storedBoardSchema.safeParse(row.papan);
      const namaPapan = papan.success ? papan.data.nama_paket : null;
      const rekaman = Array.isArray(row.records) ? row.records[0] : row.records;
      const nama =
        (typeof namaPapan === "string" && namaPapan.trim() !== ""
          ? namaPapan
          : null) ??
        (rekaman && typeof rekaman === "object" && "nama_paket" in rekaman
          ? String((rekaman as { nama_paket: unknown }).nama_paket ?? "")
          : "");
      if (nama === "") return [];
      return [{ slug: row.slug, nama, status }];
    });
  } catch {
    // Fallback T-28: basis data tidak terjangkau — daftar statis tetap tampil.
    return [];
  }
}

function KartuProyek({ proyek }: { proyek: ProyekDemo }) {
  return (
    <Link
      href={proyek.href}
      className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30"
    >
      <div className="flex items-center justify-between gap-2">
        <ChipStatus status={proyek.status} />
        {proyek.featured && (
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Unggulan
          </span>
        )}
      </div>
      <h3 className="mt-3 font-heading text-sm font-semibold leading-snug tracking-tight">{proyek.nama}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {proyek.lokasi} · {proyek.kategori}
      </p>
      <div className="mt-auto pt-4">
        <p className="font-mono text-sm font-medium">
          {formatRupiahRingkas(proyek.nilaiKontrak) ?? "—"}
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-foreground">
          Buka laporan
          <HugeiconsIcon
            icon={ArrowUpRightIcon}
            className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </p>
      </div>
    </Link>
  );
}

// Navigasi instan: judul dan salinan halaman membentuk static shell; hanya
// daftar kartu — yang membaca tanggal hari ini (WIB) dan, bila basis data
// dikonfigurasi, satu kueri unggulan — menunggu di dalam <Suspense>.
export default function ExamplesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Reveal>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Kasus contoh
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Contoh kasus
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Kasus dengan data rekaan yang dibuat untuk memperkenalkan alur Teralur tanpa menunjuk
          proyek atau penyedia nyata. Setiap kartu membuka laporan lengkap.
        </p>
      </Reveal>

      <Suspense fallback={<KerangkaKartu />}>
        <DaftarContoh />
      </Suspense>
    </main>
  );
}

async function DaftarContoh() {
  await connection();
  const unggulan = await ambilUnggulan();
  const hariIni = jakartaToday();
  const salinan = [...daftarProyekPublik(hariIni)].sort(
    (a, b) => Number(b.featured) - Number(a.featured) || a.kunci.localeCompare(b.kunci),
  );

  return (
    <>
      {unggulan.length > 0 ? (
        <section className="mt-10" aria-label="Proyek unggulan daring">
          <h2 className="font-heading text-xl font-bold tracking-tight">Proyek unggulan (daring)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Dossier lengkap yang hidup di basis data.
          </p>
          <StaggerGroup className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unggulan.map((proyek) => (
              <StaggerItem key={proyek.slug} className="h-full">
                {/* Bagian daring: aksen garis kiri kuning papan — bukan kartu
                    bernuansa penuh. */}
                <Link
                  href={`/dossiers/${proyek.slug}`}
                  className="group flex h-full flex-col rounded-lg border border-border border-l-2 border-l-kuning-papan bg-card p-5 transition-colors hover:border-foreground/30"
                >
                  <ChipStatus status={proyek.status} />
                  <p className="mt-3 font-heading text-sm font-semibold leading-snug tracking-tight">
                    {proyek.nama}
                  </p>
                  <p className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-semibold">
                    Buka dossier hidup
                    <HugeiconsIcon
                      icon={ArrowUpRightIcon}
                      className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>
      ) : null}

      <section className="mt-10" aria-label="Salinan tersimpan mode cadangan">
        <h2 className="font-heading text-xl font-bold tracking-tight">Salinan tersimpan (mode cadangan)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Seluruh proyek contoh tersimpan sebagai salinan statis dan tetap terbuka walau
          koneksi atau API sedang terganggu.
        </p>
        <StaggerGroup className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salinan.map((proyek) => (
            <StaggerItem key={proyek.kunci} className="h-full">
              <KartuProyek proyek={proyek} />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>
    </>
  );
}

// Kerangka kartu: menjaga tinggi perkiraan agar tata letak tidak melompat
// saat daftar selesai dimuat.
function KerangkaKartu() {
  return (
    <div aria-hidden className="mt-10 space-y-10">
      {[0, 1].map((blok) => (
        <div key={blok}>
          <div className="h-6 w-64 rounded-md bg-muted/70" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((kartu) => (
              <div key={kartu} className="h-40 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
