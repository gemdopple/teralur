import { z } from "zod";
import {
  AdminBoardSchema,
  AdminRecordSchema,
  AdminProjectPatchSchema,
  mergePatch,
} from "@/lib/schemas";
import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import {
  countUnggulanAktif,
  firstMessage,
  isJsonRequest,
  officialRecordFromRow,
  parseStoredBoard,
  recordMentah,
  storedStatusToApi,
  zodDetails,
  type ProjectRecordRow,
} from "@/lib/admin-projects";
import { boardToInternal, statusToInternal } from "@/lib/api-contract";
import { compare } from "@/lib/compare";
import { jakartaToday } from "@/lib/dates";
import { readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";
import { normalisasiTeks } from "@/lib/match/normalisasi";

// Satu proyek admin (Lampiran E.4–E.7): baca, ubah sebagian (aturan PATCH D.1),
// dan nonaktifkan (hapus lunak). Slug TIDAK PERNAH berubah (C-07).

const idSchema = z.string().uuid();

const SUBMISSION_COLUMNS = "id, slug, jenis, papan, status, terbit, unggulan, dinonaktifkan, record_id, diperbarui";

async function fetchSubmission(id: string) {
  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .select(SUBMISSION_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Project lookup failed: ${error.message}`);
  return data as {
    id: string;
    slug: string;
    jenis: string;
    papan: unknown;
    status: string | null;
    terbit: boolean;
    unggulan: boolean;
    dinonaktifkan: boolean;
    record_id: string | null;
    diperbarui: string;
  } | null;
}

async function fetchRecord(id: string): Promise<ProjectRecordRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("records")
    .select("id, nama_paket, penyedia, nilai_kontrak, tanggal_kontrak, masa_hari, tahun, satuan_kerja, wilayah, mentah")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Official record lookup failed: ${error.message}`);
  return (data as ProjectRecordRow | null);
}

function tahunDari(record: {
  fiscalYear: number | null;
  contractDate: string | null;
}): number {
  return (
    record.fiscalYear
    ?? (record.contractDate ? Number(record.contractDate.slice(0, 4)) : null)
    ?? Number(jakartaToday().slice(0, 4))
  );
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }

    const submission = await fetchSubmission(id);
    if (!submission || submission.jenis !== "admin" || submission.dinonaktifkan) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }

    const board = parseStoredBoard(submission.papan);
    if (board === null) {
      console.error("Stored admin project has an invalid board:", submission.slug);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }

    let officialRecord = null;
    if (submission.record_id) {
      const row = await fetchRecord(submission.record_id);
      if (row) {
        officialRecord = officialRecordFromRow(row);
      }
    }

    const { data: resources, error: resourcesError } = await getSupabaseAdmin()
      .from("resources")
      .select("id, jenis, judul, path_penyimpanan, ukuran, dibuat")
      .eq("submission_id", submission.id)
      .order("dibuat", { ascending: true });
    if (resourcesError) throw new Error(`Resource lookup failed: ${resourcesError.message}`);

    const basis = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
    return jsonOk({
      id: submission.id,
      slug: submission.slug,
      published: submission.terbit,
      featured: submission.unggulan,
      status: storedStatusToApi(submission.status),
      board,
      officialRecord,
      resources: (resources ?? []).map((row) => ({
        id: row.id,
        kind: row.jenis,
        title: row.judul,
        url: `${basis}/storage/v1/object/public/resources/${row.path_penyimpanan}`,
        size: row.ukuran,
        createdAt: row.dibuat,
      })),
      updatedAt: submission.diperbarui,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }
    if (!isJsonRequest(request)) {
      return jsonError("VALIDATION_ERROR", 400, "Content-Type harus application/json.");
    }
    const body = await readJsonBody(request);
    if (!body.valid) {
      return jsonError("VALIDATION_ERROR", 400, "Isi permintaan bukan JSON yang valid.");
    }
    const parsed = AdminProjectPatchSchema.safeParse(body.value);
    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", 422, firstMessage(parsed.error), zodDetails(parsed.error));
    }

    const submission = await fetchSubmission(id);
    if (!submission || submission.jenis !== "admin" || submission.dinonaktifkan) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }
    const currentBoard = parseStoredBoard(submission.papan);
    if (currentBoard === null) {
      console.error("Stored admin project has an invalid board:", submission.slug);
      return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
    }
    const currentRecord = submission.record_id ? await fetchRecord(submission.record_id) : null;

    const raw = (body.value ?? {}) as Record<string, unknown>;
    const rawBoard = (typeof raw.board === "object" && raw.board !== null ? raw.board : {}) as Record<string, unknown>;
    const rawRecord = (typeof raw.officialRecord === "object" && raw.officialRecord !== null ? raw.officialRecord : {}) as Record<string, unknown>;

    // Aturan PATCH (D.1): kunci dari body mentah menentukan apa yang digabung;
    // kunci null berarti kosongkan; kunci yang tidak dikirim tetap.
    let boardBaru = currentBoard;
    if (parsed.data.board !== undefined) {
      const gabungan = mergePatch(currentBoard, rawBoard, parsed.data.board);
      const validasi = AdminBoardSchema.safeParse(gabungan);
      if (!validasi.success) {
        return jsonError("VALIDATION_ERROR", 422, firstMessage(validasi.error), zodDetails(validasi.error));
      }
      boardBaru = validasi.data;
    }

    let recordBaru: z.infer<typeof AdminRecordSchema> | null = null;
    if (parsed.data.officialRecord !== undefined) {
      if (!currentRecord) {
        return jsonError("INTERNAL", 500, "Terjadi kesalahan internal.");
      }
      const gabungan = mergePatch(officialRecordFromRow(currentRecord), rawRecord, parsed.data.officialRecord);
      const validasi = AdminRecordSchema.safeParse(gabungan);
      if (!validasi.success) {
        return jsonError("VALIDATION_ERROR", 422, firstMessage(validasi.error), zodDetails(validasi.error));
      }
      recordBaru = validasi.data;
    }

    // Batas 3 unggulan aktif: proyek lain yang sudah unggulan dihitung dulu.
    if (parsed.data.featured === true) {
      const jumlah = await countUnggulanAktif(submission.id);
      if (jumlah >= 3) {
        return jsonError("FEATURED_LIMIT", 422, "Sudah ada 3 proyek unggulan. Lepas salah satu dulu.");
      }
    }

    const supabase = getSupabaseAdmin();
    const adaPerubahanData = parsed.data.board !== undefined || parsed.data.officialRecord !== undefined;

    if (adaPerubahanData) {
      const resmi = recordBaru ?? (currentRecord ? officialRecordFromRow(currentRecord) : boardBaru);
      const hasil = compare(boardBaru, resmi);
      const { error: updateError } = await supabase
        .from("submissions")
        .update({
          papan: boardToInternal(boardBaru),
          status: statusToInternal(hasil.status),
          skor: hasil.score,
          ...(parsed.data.featured !== undefined ? { unggulan: parsed.data.featured } : {}),
        })
        .eq("id", submission.id);
      if (updateError) throw new Error(`Project update failed: ${updateError.message}`);

      if (recordBaru && submission.record_id) {
        const { error: recordError } = await supabase
          .from("records")
          .update({
            nama_paket: recordBaru.packageName,
            nama_norm: normalisasiTeks(recordBaru.packageName),
            penyedia: recordBaru.supplier,
            penyedia_norm: normalisasiTeks(recordBaru.supplier ?? ""),
            nilai_kontrak: recordBaru.contractValue,
            satuan_kerja: recordBaru.agencyUnit ?? "",
            tanggal_kontrak: recordBaru.contractDate,
            masa_hari: recordBaru.durationDays,
            tahun: tahunDari(recordBaru),
            wilayah: recordBaru.locationText ?? "Wilayah simulasi",
            mentah: recordMentah(recordBaru),
          })
          .eq("id", submission.record_id);
        if (recordError) throw new Error(`Official record update failed: ${recordError.message}`);
      }

      return jsonOk({ id: submission.id, slug: submission.slug, status: hasil.status });
    }

    if (parsed.data.featured !== undefined) {
      const { error: updateError } = await supabase
        .from("submissions")
        .update({ unggulan: parsed.data.featured })
        .eq("id", submission.id);
      if (updateError) throw new Error(`Project update failed: ${updateError.message}`);
    }

    return jsonOk({ id: submission.id, slug: submission.slug, status: storedStatusToApi(submission.status) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }

    const submission = await fetchSubmission(id);
    if (!submission) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }

    // Hapus lunak (E.7): idempoten — memanggil ulang tetap sukses.
    const { error } = await getSupabaseAdmin()
      .from("submissions")
      .update({ dinonaktifkan: true, terbit: false, unggulan: false })
      .eq("id", submission.id);
    if (error) throw new Error(`Project disable failed: ${error.message}`);

    return jsonOk({ deleted: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
