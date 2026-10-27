import { AdminProjectCreateSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import {
  countUnggulanAktif,
  firstMessage,
  isJsonRequest,
  officialRecordFromRow,
  parseStoredBoard,
  storedStatusToApi,
  zodDetails,
  type ProjectRecordRow,
} from "@/lib/admin-projects";
import { boardToInternal, statusToInternal, type ApiBoard } from "@/lib/api-contract";
import { compare } from "@/lib/compare";
import { databaseConfigured, createPublicSlug, readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";

// Proyek admin (Lampiran E.2–E.3): daftar proyek dan buat proyek baru.
// Catatan resmi ditautkan dari registry (recordId), bukan ditulis di sini:
// insert submissions (tanpa record_id) -> insert records -> update record_id.
// Gagal di tengah: batalkan baris yang sudah ditulis, kembalikan 500 INTERNAL.

type ListRow = {
  id: string;
  slug: string;
  papan: unknown;
  status: string | null;
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
      .select("id, slug, papan, status, unggulan, diperbarui, records(nama_paket), resources(count)")
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

    const { board, recordId, featured, contractorId } = parsed.data;

    // Anti-korupsi: catatan resmi tidak lagi ditulis pembuat proyek. Proyek
    // menautkan satu baris registry (records, diimpor dari data pengadaan
    // independen). Tanpa tautan, status jujur: tidak_ditemukan.
    let officialRecord: ApiBoard | null = null;
    if (recordId) {
      const { data: row, error: recordLookupError } = await getSupabaseAdmin()
        .from("records")
        .select("id, nama_paket, penyedia, nilai_kontrak, tanggal_kontrak, masa_hari, tahun, satuan_kerja, wilayah, mentah, snapshot_tanggal")
        .eq("id", recordId)
        .maybeSingle();
      if (recordLookupError) {
        console.error("Unable to look up registry record:", recordLookupError.message);
        return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
      }
      if (!row) {
        return jsonError("VALIDATION_ERROR", 422, "Catatan resmi tidak ditemukan di registry.");
      }
      officialRecord = officialRecordFromRow(row as ProjectRecordRow);
    }

    // Batas 3 proyek unggulan aktif (C-01): hitung sebelum menulis apa pun.
    if (featured) {
      const jumlah = await countUnggulanAktif();
      if (jumlah >= 3) {
        return jsonError("FEATURED_LIMIT", 422, "Sudah ada 3 proyek unggulan. Lepas salah satu dulu.");
      }
    }

    const hasil = officialRecord
      ? compare(board, officialRecord)
      : { status: "not_found" as const, score: 0 };
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
      dinonaktifkan: false,
      unggulan: featured,
      contractor_id: contractorId ?? null,
      record_id: recordId ?? null,
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

    return jsonOk({ id: submission.id, slug: submission.slug, status: hasil.status }, 201);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
