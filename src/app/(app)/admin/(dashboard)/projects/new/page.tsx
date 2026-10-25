import type { Metadata } from "next";
import { connection } from "next/server";
import { FormProyek } from "@/components/teralur/admin/FormProyek";
import { jakartaToday } from "@/lib/dates";

export const metadata: Metadata = { title: "Buat proyek | Admin Teralur" };

// Halaman buat proyek (Lampiran L.3). Formulir klien memanggil
// POST /api/admin/projects; sesi sudah diverifikasi layout grup (dashboard).
// Render dinamis: pratinjau cincin butuh tanggal hari ini (WIB) saat render.
export const instant = false;

export default async function AdminProjectNewPage() {
  await connection();
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="font-heading text-2xl font-extrabold">Buat proyek</h1>
      <div className="mt-6">
        <FormProyek mode="create" today={jakartaToday()} />
      </div>
    </main>
  );
}
