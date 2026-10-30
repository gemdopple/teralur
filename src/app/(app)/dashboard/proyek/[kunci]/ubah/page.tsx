import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { FormProyek } from "@/components/teralur/admin/FormProyek";
import { kelasTombol } from "@/lib/kelas-tombol";
import {
  officialRecordFromRow,
  parseStoredBoard,
  type ProjectRecordRow,
} from "@/lib/admin-projects";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";
import { META_ROLE } from "@/lib/roles";
import { identitasSaatIni } from "@/lib/identitas";
import { daftarKontraktorAktif, daftarSatuanKerjaPemerintah } from "@/lib/opsi-form-proyek";

// Ubah proyek (alur pemerintah): formulir yang sama dengan halaman kelola admin
// (FormProyek mode="edit", PATCH /api/admin/projects/[id]). Halaman sengaja
// ramping — tanpa resource, QR, dan laporan warga yang ada di halaman kelola
// admin (/dashboard/proyek/[kunci]/kelola). Jalur data memakai helper bersama
// T-41 (parseStoredBoard, officialRecordFromRow), sama dengan halaman kelola.
// Segmen [kunci] dipakai bersama lembar papan: di sini isinya id proyek (UUID).

export const metadata: Metadata = { title: "Ubah proyek | Dasbor Teralur" };
export const instant = false;

const ID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function TidakDitemukan() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 text-center">
      <h1 className="font-heading text-xl font-semibold tracking-tight">Proyek tidak ditemukan</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Proyek sudah dihapus atau alamatnya salah.
      </p>
      <Link href="/dashboard/proyek" className={`${kelasTombol("outline")} mt-6 w-fit`}>
        Kembali ke daftar proyek
      </Link>
    </main>
  );
}

export default async function HalamanUbahProyek({
  params,
}: {
  params: Promise<{ kunci: string }>;
}) {
  await connection();
  const { kunci } = await params;
  const { role: peran } = await identitasSaatIni();

  if (peran !== "pemerintah") {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 text-center">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Perubahan hanya untuk peran Pemerintah
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Peran akun Anda saat ini adalah {META_ROLE[peran].label}. Hanya akun Pemerintah yang dapat
          mengubah penugasan proyek.
        </p>
        <Link href="/dashboard/proyek" className={`${kelasTombol("outline")} mt-6 w-fit`}>
          Kembali ke daftar proyek
        </Link>
      </main>
    );
  }

  if (!ID_UUID.test(kunci) || !databaseConfigured()) {
    return <TidakDitemukan />;
  }

  const { data: submission } = await getSupabaseAdmin()
    .from("submissions")
    .select(
      "id, slug, jenis, papan, status, unggulan, dinonaktifkan, record_id, contractor_id, diperbarui",
    )
    .eq("id", kunci)
    .maybeSingle();

  if (!submission || submission.jenis !== "admin" || submission.dinonaktifkan) {
    return <TidakDitemukan />;
  }

  const board = parseStoredBoard(submission.papan);
  if (board === null) {
    throw new Error(`Stored admin project has an invalid board: ${submission.slug}`);
  }

  let officialRecord = null;
  if (submission.record_id) {
    const { data: recordRow } = await getSupabaseAdmin()
      .from("records")
      .select(
        "id, nama_paket, penyedia, nilai_kontrak, tanggal_kontrak, masa_hari, tahun, satuan_kerja, wilayah, mentah",
      )
      .eq("id", submission.record_id)
      .maybeSingle();
    if (recordRow) {
      officialRecord = officialRecordFromRow(recordRow as ProjectRecordRow);
    }
  }

  // Daftar kontraktor untuk penugasan (satu kontraktor per proyek).
  const [kontraktor, satuanKerja] = await Promise.all([
    daftarKontraktorAktif(),
    daftarSatuanKerjaPemerintah(),
  ]);

  return (
    <>
      <KepalaDasbor
        judul="Ubah proyek"
        deskripsi="Perbarui data papan lapangan, ubah kontraktor pelaksana, lalu simpan. Perubahan langsung memperbarui status pencocokan."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <FormProyek
          mode="edit"
          kembaliKe="/dashboard/proyek"
          kontraktor={kontraktor}
          satuanKerja={satuanKerja}
          initial={{
            id: submission.id,
            slug: submission.slug,
            featured: submission.unggulan,
            contractorId: submission.contractor_id,
            board,
            officialRecord,
            recordId: submission.record_id ?? null,
          }}
        />
      </div>
    </>
  );
}
