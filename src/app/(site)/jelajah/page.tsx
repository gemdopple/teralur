import type { Metadata } from "next";
import { connection } from "next/server";
import { PetaProyek } from "@/components/teralur/PetaProyek";
import { PemindaiQr } from "@/components/teralur/PemindaiQr";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekPublik } from "@/data/proyek-demo";

// Peta publik warga (redesign v2): cari proyek di sekitar lokasi tanpa akun.
// Data memakai dataset simulasi statis (mode cadangan) sehingga peta tetap
// hidup tanpa basis data; koordinat berlabel simulasi.
//
// Pemindai QR di sisi klien: akses kamera hanya berjalan pada konteks aman —
// produksi wajib HTTPS, sedangkan localhost dikecualikan browser secara bawaan.

export const metadata: Metadata = {
  title: "Jelajah Peta Proyek | Teralur",
  description:
    "Temukan proyek publik di sekitar lokasi Anda dan baca laporan lengkapnya tanpa perlu akun.",
};

export const instant = false;

export default async function HalamanJelajah({
  searchParams,
}: {
  searchParams: Promise<{ pindai?: string }>;
}) {
  await connection();
  const { pindai } = await searchParams;
  const hariIni = jakartaToday();
  const proyek = daftarProyekPublik(hariIni);

  return (
    <div className="flex-1">
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="absolute inset-0 bg-glow" />
        <div aria-hidden className="absolute inset-0 bg-dots" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Peta publik
          </p>
          <h1 className="text-balance mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Proyek di sekitar Anda.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Cari lewat nama, lokasi, atau penyedia; atau tekan tombol lokasi untuk mengurutkan
            proyek terdekat dari posisi Anda. Laporan lengkap terbuka tanpa akun.
          </p>
        </div>
      </section>

      <section id="pindai" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_400px] md:items-center">
          <Reveal>
            <h2 className="text-balance font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Punya ponsel di lokasi?
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Pindai QR pada papan proyek langsung dari halaman ini. Kamera aktif
              hanya selama pemindai terbuka, dan gambar tidak pernah disimpan di
              mana pun.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <PemindaiQr mulaiOtomatis={pindai === "1"} />
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Reveal>
          <PetaProyek items={proyek} />
        </Reveal>
      </section>
    </div>
  );
}
