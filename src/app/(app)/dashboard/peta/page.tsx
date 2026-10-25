import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { PetaProyek } from "@/components/teralur/PetaProyek";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekPublik } from "@/data/proyek-demo";

// Peta proyek di dalam dasbor (semua peran): komponen peta yang sama dengan
// halaman publik /jelajah, dipakai ulang agar perilaku pencarian identik.

export const instant = false;

export default async function HalamanPetaDasbor() {
  await connection();
  const proyek = daftarProyekPublik(jakartaToday());

  return (
    <>
      <KepalaDasbor
        judul="Peta proyek"
        deskripsi="Cari proyek lewat nama, lokasi, atau penyedia; urutkan dari posisi Anda; atau pilih pin pada peta."
      />
      <Reveal className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <PetaProyek items={proyek} />
      </Reveal>
    </>
  );
}
