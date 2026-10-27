import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import { databaseConfigured } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";

// Pencarian registry catatan resmi (tabel `records`, diimpor dari data
// pengadaan independen lewat npm run import:records) untuk pemilih
// "Data resmi" di FormProyek. Admin-only: warga tetap memakai /api/search.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type BarisRegistry = {
  id: string;
  nama_paket: string;
  penyedia: string | null;
  nilai_kontrak: number | string | null;
  tanggal_kontrak: string | null;
  masa_hari: number | null;
  tahun: number | null;
  satuan_kerja: string | null;
};

export async function GET(request: Request) {
  try {
    await requireAdmin();
    if (!databaseConfigured()) {
      return jsonError("INTERNAL", 500, "Basis data belum dikonfigurasi.");
    }
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
    // Trigram % butuh teks cukup panjang agar kandidat bermakna.
    if (q.length < 3) {
      return jsonOk({ results: [] });
    }

    const { data, error } = await getSupabaseAdmin().rpc("search_records", {
      search_text: q,
      result_limit: 10,
    });
    if (error) {
      console.error("Registry search failed:", error.message);
      return jsonError("INTERNAL", 500, "Pencarian registry gagal.");
    }

    return jsonOk({
      results: ((data ?? []) as BarisRegistry[]).flatMap((row) => {
        const id = UUID_RE.test(row.id) ? row.id : null;
        if (!id) return [];
        return [
          {
            id,
            packageName: row.nama_paket,
            supplier: row.penyedia,
            contractValue: row.nilai_kontrak === null ? null : Number(row.nilai_kontrak),
            contractDate: row.tanggal_kontrak,
            durationDays: row.masa_hari,
            fiscalYear: row.tahun,
            agencyUnit: row.satuan_kerja,
          },
        ];
      }),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
