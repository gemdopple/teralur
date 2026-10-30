import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { PetaProyek } from "@/components/teralur/PetaProyek";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekPublik, type ProyekDemo } from "@/data/proyek-demo";
import { daftarProyekNyata } from "@/lib/proyek-nyata";

// Peta proyek di dalam dasbor (semua peran): komponen peta yang sama dengan
// halaman publik /jelajah, dipakai ulang agar perilaku pencarian identik.
// Isinya gabungan: proyek NYATA dari basis data (yang punya titik koordinat
// dari pemilih lokasi formulir) tampil lebih dulu, lalu dataset simulasi.

export const instant = false;

export default async function HalamanPetaDasbor() {
  await connection();
  const today = jakartaToday();
  const [nyata, simulasi] = await Promise.all([
    daftarProyekNyata(today),
    Promise.resolve(daftarProyekPublik(today)),
  ]);
  // Baris tanpa koordinat tidak punya pin untuk digambar — saring di sini.
  const proyekNyataBerpin = nyata.filter(
    (item): item is ProyekDemo => item.lat !== null && item.lng !== null,
  );

  return (
    <>
      <KepalaDasbor
        judul="Peta proyek"
        deskripsi="Cari proyek lewat nama, lokasi, atau penyedia; urutkan dari posisi Anda; atau pilih pin pada peta."
      />
      <Reveal className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <PetaProyek items={[...proyekNyataBerpin, ...simulasi]} />
      </Reveal>
    </>
  );
}
