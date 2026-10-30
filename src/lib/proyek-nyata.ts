import "server-only";
import { kategoriDariNama, type ProyekPublik } from "@/data/proyek-demo";
import { parseStoredBoard } from "@/lib/admin-projects";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";

// Proyek NYATA dari basis data dalam bentuk baris publik (ProyekPublik) —
// sumber tunggal untuk peta dasbor dan ringkasan, urut terbaru lebih dulu.
// Koordinat boleh null (proyek tanpa titik peta); halaman peta yang
// menyaring baris tanpa pin.

// PostgREST mengembalikan objek untuk embed many-to-one; terima keduanya.
type EmbedSatu<T> = T | T[] | null;

type BarisNyata = {
  slug: string;
  status: string | null;
  unggulan: boolean;
  papan: unknown;
  records: EmbedSatu<{
    penyedia: string | null;
    nilai_kontrak: number | string | null;
    masa_hari: number | null;
    tahun: number | null;
  }>;
};

function satu<T>(value: EmbedSatu<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function barisKePublik(row: BarisNyata, today: string): ProyekPublik | null {
  const papan = parseStoredBoard(row.papan);
  if (!papan) return null;
  const record = satu(row.records);
  const status =
    row.status === "cocok" || row.status === "selisih" || row.status === "tidak_ditemukan"
      ? row.status
      : "tidak_ditemukan";
  return {
    kunci: `db-${row.slug}`,
    href: `/dossiers/${row.slug}`,
    nama: papan.packageName ?? "(tanpa judul)",
    penyedia: record?.penyedia ?? null,
    penyediaPapan: papan.supplier,
    nilaiKontrak:
      record?.nilai_kontrak !== null && record?.nilai_kontrak !== undefined
        ? Number(record.nilai_kontrak)
        : null,
    nilaiPapan: papan.contractValue,
    masaHari: record?.masa_hari ?? papan.durationDays,
    lokasi: papan.locationText ?? "—",
    kategori: kategoriDariNama(papan.packageName ?? ""),
    status,
    lat: papan.locationLatitude ?? null,
    lng: papan.locationLongitude ?? null,
    featured: row.unggulan,
    tahun: record?.tahun ?? papan.fiscalYear ?? Number(today.slice(0, 4)),
    instansi: papan.agencyUnit ?? "—",
    sumberDana: papan.fundingSource ?? "—",
    nomorKontrak: papan.contractNumber ?? "—",
  };
}

/** Proyek nyata (urut terbaru) dari basis data dalam bentuk baris publik. */
export async function daftarProyekNyata(today: string): Promise<ProyekPublik[]> {
  if (!databaseConfigured()) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .select("slug, status, unggulan, papan, records(penyedia, nilai_kontrak, masa_hari, tahun)")
    .eq("jenis", "admin")
    .eq("dinonaktifkan", false)
    .order("diperbarui", { ascending: false });
  if (error) throw new Error(`Real project query failed: ${error.message}`);
  return ((data ?? []) as BarisNyata[])
    .map((row) => barisKePublik(row, today))
    .filter((item): item is ProyekPublik => item !== null);
}
