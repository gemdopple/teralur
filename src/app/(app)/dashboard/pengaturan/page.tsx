import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { FormPengaturan } from "@/components/teralur/FormPengaturan";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { META_ROLE } from "@/lib/roles";
import { identitasSaatIni } from "@/lib/identitas";

// Pengaturan dasbor (konfigurasi per peran): pemerintah dan kontraktor
// mengatur preferensi tampilan; admin melihat keadaan lingkungan. Pengelolaan
// akun tidak ada di sini lagi — sudah punya seksi sendiri di sidebar (Akun).

export const instant = false;

export default async function HalamanPengaturan() {
  await connection();
  const { role: peran } = await identitasSaatIni();

  return (
    <>
      <KepalaDasbor
        judul="Pengaturan"
        deskripsi={`Konfigurasi untuk peran ${META_ROLE[peran].label}.`}
      />
      <Reveal className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <FormPengaturan
          peran={peran}
          informasiAdmin={{
            fotoFlow: process.env.PHOTO_FLOW_ENABLED === "true",
            situsUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
          }}
        />
      </Reveal>
    </>
  );
}