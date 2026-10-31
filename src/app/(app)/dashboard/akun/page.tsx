import type { Metadata } from "next";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { FormKataSandi, KartuSesi } from "@/components/teralur/akun-saya";
import { identitasSaatIni } from "@/lib/identitas";
import { META_ROLE } from "@/lib/roles";

// Akun saya — halaman akun pengelola yang sedang masuk, semua peran.
// Menampilkan identitas (email + peran dari profiles server-side), ganti kata
// sandi, dan keluar. Berbeda dari /dashboard/akun/pemerintah|kontraktor yang
// dipakai admin untuk mengelola akun ORANG LAIN.
//
// Tata letak memakai lebar konten penuh: kartu pendek (info + sesi) di kolom
// kiri, formulir kata sandi yang lebih tinggi di kanan — tanpa kolom sempit
// yang melayang di tengah menyisakan ruang kosong di kedua sisi.

export const instant = false;

export const metadata: Metadata = {
  title: "Akun saya",
};

export default async function HalamanAkunSaya() {
  const identitas = await identitasSaatIni();
  const peran = META_ROLE[identitas.role];

  return (
    <div className="flex-1">
      <KepalaDasbor
        judul="Akun saya"
        deskripsi="Informasi akun, kata sandi, dan sesi masuk Anda."
      />
      <div className="grid w-full gap-4 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] xl:items-start">
        <div className="grid gap-4">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold tracking-tight">
              Informasi akun
            </h2>
            {/* Baris rapat: label di kolom tetap, nilai langsung menyusul —
                tanpa justify-between yang menyandarkan nilai ke ujung kanan. */}
            <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate font-medium" title={identitas.email}>
                {identitas.email}
              </dd>
              <dt className="text-muted-foreground">Peran</dt>
              <dd className="flex items-center gap-2 font-medium">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-kuning-papan" />
                {peran.label}
              </dd>
            </dl>
            <p className="mt-4 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
              {peran.deskripsi} Peran melekat pada akun dan hanya dapat diubah pengelola situs.
            </p>
          </section>

          <KartuSesi />
        </div>

        <FormKataSandi email={identitas.email} />
      </div>
    </div>
  );
}
