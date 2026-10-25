import { cookies } from "next/headers";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { FormPengaturan } from "@/components/teralur/FormPengaturan";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { peranDariNilai, META_ROLE, ROLE_COOKIE } from "@/lib/roles";

// Pengaturan dasbor (konfigurasi per peran): pemerintah dan kontraktor
// mengatur preferensi tampilan; admin melihat keadaan lingkungan (flag,
// domain) dan tautan konsol.

export const instant = false;

export default async function HalamanPengaturan() {
  const cookieStore = await cookies();
  const peran = peranDariNilai(cookieStore.get(ROLE_COOKIE)?.value);

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
