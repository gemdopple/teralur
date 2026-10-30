import type { Metadata } from "next";
import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { FormProyek } from "@/components/teralur/admin/FormProyek";
import {
  PengunggahResource,
  type ResourceAdmin,
} from "@/components/teralur/admin/PengunggahResource";
import { PanelQR } from "@/components/teralur/admin/PanelQR";
import { TabelLaporanWarga } from "@/components/teralur/admin/TabelLaporanWarga";
import {
  officialRecordFromRow,
  parseStoredBoard,
  type ProjectRecordRow,
} from "@/lib/admin-projects";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";
import { basisSitus } from "@/lib/qr";
import { identitasSaatIni } from "@/lib/identitas";
import { daftarKontraktorAktif, daftarSatuanKerjaPemerintah } from "@/lib/opsi-form-proyek";

// Detail proyek untuk admin — satu halaman, semua yang dimiliki admin.
//
// Sebelumnya konsol admin punya halaman ubah sendiri (/admin/projects/[id])
// yang terpisah dari halaman pemerintah. Sekarang keduanya bergabung di sini:
// admin mendapat formulir ubah + penugasan kontraktor (sama seperti pemerintah)
// DAN resource, QR, serta moderasi laporan warga (khusus admin). Pemerintah
// tetap memakai halaman ramping /dashboard/proyek/[kunci]/ubah.

export const metadata: Metadata = { title: "Kelola proyek | Dasbor Teralur" };
export const instant = false;

const ID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Pesan({ judul, isi }: { judul: string; isi: string }) {
  return (
    <>
      <KepalaDasbor
        judul="Kelola proyek"
        deskripsi="Ubah data proyek, resource, QR, dan laporan warga."
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold tracking-tight">{judul}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{isi}</p>
        </div>
      </main>
    </>
  );
}

export default async function KelolaProyekAdminPage({
  params,
}: {
  params: Promise<{ kunci: string }>;
}) {
  await connection();
  const { kunci } = await params;
  const { role: peran } = await identitasSaatIni();

  // Halaman ini hanya untuk admin; peran lain memakai halaman ubah mereka.
  if (peran !== "admin") {
    return (
      <Pesan
        judul="Halaman ini untuk Admin"
        isi="Peran akun Anda saat ini bukan Admin. Gunakan daftar proyek untuk mengelola penugasan."
      />
    );
  }

  if (!ID_UUID.test(kunci) || !databaseConfigured()) {
    return (
      <Pesan judul="Proyek tidak ditemukan" isi="Proyek sudah dihapus atau alamatnya salah." />
    );
  }

  const { data: submission } = await getSupabaseAdmin()
    .from("submissions")
    .select(
      "id, slug, jenis, papan, status, unggulan, dinonaktifkan, record_id, contractor_id, diperbarui",
    )
    .eq("id", kunci)
    .maybeSingle();

  if (!submission || submission.jenis !== "admin" || submission.dinonaktifkan) {
    return (
      <Pesan judul="Proyek tidak ditemukan" isi="Proyek sudah dihapus atau alamatnya salah." />
    );
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

  // Daftar kontraktor: dipakai untuk penugasan satu kontraktor per proyek.
  const [kontraktor, satuanKerja] = await Promise.all([
    daftarKontraktorAktif(),
    daftarSatuanKerjaPemerintah(),
  ]);

  // Resource proyek (L.4) untuk PengunggahResource.
  const { data: resourceRows } = await getSupabaseAdmin()
    .from("resources")
    .select("id, jenis, judul, ukuran, path_penyimpanan, dibuat")
    .eq("submission_id", submission.id)
    .order("dibuat", { ascending: true });
  const basis = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const resources: ResourceAdmin[] = (resourceRows ?? []).map((row) => ({
    id: row.id,
    kind: row.jenis === "document" ? "document" : "photo",
    title: row.judul,
    url: `${basis}/storage/v1/object/public/resources/${row.path_penyimpanan}`,
    size: Number(row.ukuran ?? 0),
    createdAt: row.dibuat,
  }));

  return (
    <>
      <KepalaDasbor
        judul="Kelola proyek"
        deskripsi="Ubah data papan, tetapkan kontraktor, unggah resource, siapkan QR, dan moderasi laporan warga."
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

        {/* L.4 (PengunggahResource) dan L.5 (PanelQR): khusus admin. */}
        <div className="mt-10">
          <PengunggahResource projectId={submission.id} initialResources={resources} />
        </div>

        <div className="mt-10">
          <PanelQR
            projectId={submission.id}
            slug={submission.slug}
            siteUrl={await basisSitus().catch(() => "")}
          />
        </div>

        {/* L.6 (T-47): moderasi laporan warga untuk proyek ini. */}
        <div className="mt-10">
          <TabelLaporanWarga projectId={submission.id} />
        </div>
      </div>
    </>
  );
}
