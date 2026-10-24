import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormProyek } from "@/components/teralur/admin/FormProyek";
import { PengunggahResource, type ResourceAdmin } from "@/components/teralur/admin/PengunggahResource";
import { PanelQR } from "@/components/teralur/admin/PanelQR";
import { TabelLaporanWarga } from "@/components/teralur/admin/TabelLaporanWarga";
import { officialRecordFromRow, parseStoredBoard, type ProjectRecordRow } from "@/lib/admin-projects";
import { jakartaToday } from "@/lib/dates";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";

export const metadata: Metadata = { title: "Ubah proyek | Admin Teralur" };

// Halaman ubah proyek (Lampiran L.3). Komponen server: membaca proyek langsung
// dari DB memakai klien service-role (pola halaman daftar T-40) dengan helper
// bersama T-41 (parseStoredBoard, officialRecordFromRow) — jalur data yang sama
// dengan GET /api/admin/projects/[id]. Sesi sudah diverifikasi layout grup.
export const instant = false;

const ID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function TidakDitemukan() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="font-heading text-2xl font-extrabold">Ubah proyek</h1>
      <Card className="mt-6">
        <CardContent className="space-y-4 py-6">
          <p>Proyek tidak ditemukan.</p>
          <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
            Kembali ke daftar proyek
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

export default async function AdminProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Render dinamis per-permintaan; data proyek tidak boleh ter-cache antar sesi.
  await connection();
  const { id } = await params;

  if (!ID_UUID.test(id)) {
    return <TidakDitemukan />;
  }
  if (!databaseConfigured()) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="font-heading text-2xl font-extrabold">Ubah proyek</h1>
        <p className="mt-3 text-neutral-700">
          Basis data belum dikonfigurasi. Hubungkan Supabase untuk mengelola proyek.
        </p>
      </main>
    );
  }

  const { data: submission } = await getSupabaseAdmin()
    .from("submissions")
    .select("id, slug, jenis, papan, status, terbit, unggulan, dinonaktifkan, record_id, diperbarui")
    .eq("id", id)
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
      .select("id, nama_paket, penyedia, nilai_kontrak, tanggal_kontrak, masa_hari, tahun, satuan_kerja, wilayah, mentah")
      .eq("id", submission.record_id)
      .maybeSingle();
    if (recordRow) {
      officialRecord = officialRecordFromRow(recordRow as ProjectRecordRow);
    }
  }

  // L.4: daftar resource proyek untuk PengunggahResource (url publik Storage
  // dibangun sama seperti route API / api dossier).
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
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="font-heading text-2xl font-extrabold">Ubah proyek</h1>
      <div className="mt-6">
        <FormProyek
          mode="edit"
          today={jakartaToday()}
          initial={{
            id: submission.id,
            slug: submission.slug,
            published: submission.terbit,
            featured: submission.unggulan,
            board,
            officialRecord,
          }}
        />
      </div>

      {/* L.4 (PengunggahResource) — hanya setelah proyek tersimpan (selalu
          kasus di halaman ubah) dan L.5 (PanelQR). */}
      <div className="mt-10">
        <PengunggahResource projectId={submission.id} initialResources={resources} />
      </div>

      <div className="mt-10">
        <PanelQR
          projectId={submission.id}
          slug={submission.slug}
          published={submission.terbit}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
        />
      </div>

      {/* L.6 (T-47): kunci proyek = id catatan resmi bila ada (E.13). */}
      <div className="mt-10">
        <TabelLaporanWarga projectId={submission.record_id ?? submission.id} />
      </div>
    </main>
  );
}
