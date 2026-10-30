import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { FormProyek } from "@/components/teralur/admin/FormProyek";
import { kelasTombol } from "@/lib/kelas-tombol";
import { META_ROLE } from "@/lib/roles";
import { identitasSaatIni } from "@/lib/identitas";
import { databaseConfigured } from "@/lib/server-api";
import { daftarKontraktorAktif, daftarSatuanKerjaPemerintah } from "@/lib/opsi-form-proyek";

// Penugasan proyek (alur pemerintah): hanya peran Pemerintah yang bisa
// memasukkan/menugaskan proyek lewat dasbor. Peran berasal dari akun
// (server-side), jadi pemeriksaan di sini benar-benar membatasi akses.

export const metadata: Metadata = { title: "Tugaskan proyek | Dasbor Teralur" };
export const instant = false;

export default async function HalamanTugaskanProyek() {
  const identitas = await identitasSaatIni();
  const peran = identitas.role;

  // Admin punya halaman buat sendiri (membawa resource/QR); tombol "Buat
  // proyek" di daftar proyek mengarah ke pintu yang sesuai peran.
  if (peran === "admin") redirect("/dashboard/proyek/buat");

  if (peran !== "pemerintah") {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 text-center">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Penugasan hanya untuk peran Pemerintah
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Peran akun Anda saat ini adalah {META_ROLE[peran].label}. Hanya akun Pemerintah yang dapat
          menugaskan proyek.
        </p>
        <Link href="/dashboard/proyek" className={`${kelasTombol("outline")} mt-6 w-fit`}>
          Kembali ke daftar proyek
        </Link>
      </main>
    );
  }

  // Daftar kontraktor untuk pemilihan penugasan (satu kontraktor per proyek).
  let kontraktor: { id: string; nama: string }[] = [];
  let satuanKerja: string[] = [];
  if (databaseConfigured()) {
    [kontraktor, satuanKerja] = await Promise.all([
      daftarKontraktorAktif(),
      daftarSatuanKerjaPemerintah(),
    ]);
  }

  return (
    <>
      <KepalaDasbor
        judul="Tugaskan proyek"
        deskripsi="Masukkan data papan lapangan, tetapkan kontraktor pelaksana, lalu simpan."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <FormProyek
          mode="create"
          kembaliKe="/dashboard/proyek"
          kontraktor={kontraktor}
          satuanKerja={satuanKerja}
        />
      </div>
    </>
  );
}
