import { AdminProjectCreateSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import {
  countUnggulanAktif,
  firstMessage,
  isJsonRequest,
  parseStoredBoard,
  storedStatusToApi,
  zodDetails,
} from "@/lib/admin-projects";
import { boardToInternal, statusToInternal } from "@/lib/api-contract";
import { compare } from "@/lib/compare";
import { jakartaToday } from "@/lib/dates";
import { databaseConfigured, createPublicSlug, readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";
import { normalisasiTeks } from "@/lib/match/normalisasi";

// Proyek admin (Lampiran E.2–E.3): daftar proyek dan buat proyek baru.
// Proyek menulis DUA baris (submissions + records) sesuai urutan C.3:
// insert submissions (tanpa record_id) -> insert records -> update record_id.
// Gagal di tengah: batalkan baris yang sudah ditulis, kembalikan 500 INTERNAL.

type ListRow = {
  id: string;
  slug: string;
  papan: unknown;
  status: string | null;
  terbit: boolean;
  unggulan: boolean;
  diperbarui: string;
  records: { nama_paket: string } | null;
  resources: { count: number }[] | null;
};

export async function GET() {
  try {
    await requireAdmin();
    if (!databaseConfigured()) {
      return jsonError("INTERNAL", 500, "Basis data belum dikonfigurasi.");
    }

    const { data, error } = await getSupabaseAdmin()
      .from("submissions")
      .select("id, slug, papan, status, terbit, unggulan, diperbarui, records(nama_paket), resources(count)")
      .eq("jenis", "admin")
      .eq("dinonaktifkan", false)
      .order("diperbarui", { ascending: false });
    if (error) throw new Error(`Project list failed: ${error.message}`);

    const rows = (data ?? []) as unknown as ListRow[];
    return jsonOk({
      projects: rows.map((row) => {
        const board = parseStoredBoard(row.papan);
        return {
          id: row.id,
          slug: row.slug,
          title: board?.packageName ?? row.records?.nama_paket ?? null,
          status: storedStatusToApi(row.status),
          published: row.terbit,
          featured: row.unggulan,
          resourceCount: Number(row.resources?.[0]?.count ?? 0),
          updatedAt: row.diperbarui,
        };
      }),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    if (!isJsonRequest(request)) {
      return jsonError("VALIDATION_ERROR", 400, "Content-Type harus application/json.");
    }
    const body = await readJsonBody(request);
    if (!body.valid) {
      return jsonError("VALIDATION_ERROR", 400, "Isi permintaan bukan JSON yang valid.");
    }
    const parsed = AdminProjectCreateSchema.safeParse(body.value);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", 422, firstMessage(parsed.error), zodDetails(parsed.error));
    }
    if (!databaseConfigured()) {
      return jsonError("INTERNAL", 500, "Basis data belum dikonfigurasi.");
    }

    const { board, officialRecord, featured } = parsed.data;

    // Batas 3 proyek unggulan aktif (C-01): hitung sebelum menulis apa pun.
    if (featured) {
      const jumlah = await countUnggulanAktif();
      if (jumlah >= 3) {
        return jsonError("FEATURED_LIMIT", 422, "Sudah ada 3 proyek unggulan. Lepas salah satu dulu.");
      }
    }

    const hasil = compare(board, officialRecord);
    const statusInternal = statusToInternal(hasil.status);
    const supabase = getSupabaseAdmin();

    const submissionInsert = {
      slug: createPublicSlug(),
      jenis: "admin",
      papan: boardToInternal(board),
      status: statusInternal,
      skor: hasil.score,
      // C.3 menulis `kandidat = []`, tetapi jalur dossier publik yang sudah ada
      // mem-parsing kandidat dengan storedCandidateBundleSchema (bentuk bundle).
      // Kode yang sudah ada menang (Lampiran A) — lihat docs/agent-notes.md.
      kandidat: { requiresSelection: false, candidates: [] },
      demo: true,
      terbit: false,
      dinonaktifkan: false,
      unggulan: featured,
    };
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert(submissionInsert)
      .select("id, slug")
      .single();
    if (submissionError || !submission) {
      console.error("Unable to save admin project submission:", submissionError?.message);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }

    const tahunCadangan = officialRecord.fiscalYear
      ?? (officialRecord.contractDate ? Number(officialRecord.contractDate.slice(0, 4)) : null)
      ?? Number(jakartaToday().slice(0, 4));

    const recordInsert = {
      sumber: "simulasi",
      id_sumber: `admin-${submission.id}`,
      demo: true,
      nama_paket: officialRecord.packageName,
      nama_norm: normalisasiTeks(officialRecord.packageName),
      penyedia: officialRecord.supplier,
      penyedia_norm: normalisasiTeks(officialRecord.supplier),
      nilai_kontrak: officialRecord.contractValue,
      satuan_kerja: officialRecord.agencyUnit ?? "",
      tanggal_kontrak: officialRecord.contractDate,
      masa_hari: officialRecord.durationDays,
      tahun: tahunCadangan,
      wilayah: officialRecord.locationText ?? "Wilayah simulasi",
      metode: null,
      mentah: {
        fundingSource: officialRecord.fundingSource,
        contractNumber: officialRecord.contractNumber,
        locationText: officialRecord.locationText,
      },
      snapshot_tanggal: jakartaToday(),
    };
    const { data: record, error: recordError } = await supabase
      .from("records")
      .insert(recordInsert)
      .select("id")
      .single();
    if (recordError || !record) {
      await supabase.from("submissions").delete().eq("id", submission.id);
      console.error("Unable to save admin project record:", recordError?.message);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }

    const { error: linkError } = await supabase
      .from("submissions")
      .update({ record_id: record.id })
      .eq("id", submission.id);
    if (linkError) {
      await supabase.from("records").delete().eq("id", record.id);
      await supabase.from("submissions").delete().eq("id", submission.id);
      console.error("Unable to link admin project record:", linkError.message);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }

    return jsonOk({ id: submission.id, slug: submission.slug, status: hasil.status }, 201);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
