import { z } from "zod";
import {
  AdminBoardSchema,
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
  storedStatusToApi,
  zodDetails,
  type ProjectRecordRow,
} from "@/lib/admin-projects";
import { boardToInternal, statusToInternal, type ApiBoard } from "@/lib/api-contract";
import { compare } from "@/lib/compare";
import { readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";

// Satu proyek admin (Lampiran E.4–E.7): baca, ubah sebagian (aturan PATCH D.1),
// dan nonaktifkan (hapus lunak). Slug TIDAK PERNAH berubah (C-07).

const idSchema = z.string().uuid();

const SUBMISSION_COLUMNS = "id, slug, jenis, papan, status, unggulan, dinonaktifkan, record_id, contractor_id, diperbarui";

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
    unggulan: boolean;
    dinonaktifkan: boolean;
    record_id: string | null;
    contractor_id: string | null;
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
      featured: submission.unggulan,
      status: storedStatusToApi(submission.status),
      board,
      officialRecord,
      contractorId: submission.contractor_id,
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

    // Catatan resmi kini ditautkan dari registry (anti-korupsi): null = lepas
    // tautan; uuid = tautkan ulang; undefined (tidak dikirim) = biarkan.
    let recordLinkBaru: string | null | undefined;
    let resmiBaru: ApiBoard | null = currentRecord
      ? officialRecordFromRow(currentRecord)
      : null;
    if (parsed.data.recordId !== undefined) {
      if (parsed.data.recordId === null) {
        recordLinkBaru = null;
        resmiBaru = null;
      } else {
        const row = await fetchRecord(parsed.data.recordId);
        if (!row) {
          return jsonError("VALIDATION_ERROR", 422, "Catatan resmi tidak ditemukan di registry.");
        }
        recordLinkBaru = row.id;
        resmiBaru = officialRecordFromRow(row);
      }
    }

    // Batas 3 unggulan aktif: proyek lain yang sudah unggulan dihitung dulu.
    if (parsed.data.featured === true) {
      const jumlah = await countUnggulanAktif(submission.id);
      if (jumlah >= 3) {
        return jsonError("FEATURED_LIMIT", 422, "Sudah ada 3 proyek unggulan. Lepas salah satu dulu.");
      }
    }

    const supabase = getSupabaseAdmin();
    const adaPerubahanData =
      parsed.data.board !== undefined || parsed.data.recordId !== undefined;
    const contractorDikirim = parsed.data.contractorId !== undefined;

    if (adaPerubahanData) {
      // Tanpa catatan resmi tertaut, status jujur: tidak_ditemukan.
      const hasil = resmiBaru
        ? compare(boardBaru, resmiBaru)
        : { status: "not_found" as const, score: 0 };
      const { error: updateError } = await supabase
        .from("submissions")
        .update({
          papan: boardToInternal(boardBaru),
          status: statusToInternal(hasil.status),
          skor: hasil.score,
          ...(parsed.data.featured !== undefined ? { unggulan: parsed.data.featured } : {}),
          // Penugasan kontraktor ikut tersimpan bila dikirim (null = lepas tugas).
          ...(contractorDikirim ? { contractor_id: parsed.data.contractorId ?? null } : {}),
          ...(recordLinkBaru !== undefined ? { record_id: recordLinkBaru } : {}),
        })
        .eq("id", submission.id);
      if (updateError) throw new Error(`Project update failed: ${updateError.message}`);

      return jsonOk({ id: submission.id, slug: submission.slug, status: hasil.status });
    }

    if (parsed.data.featured !== undefined || contractorDikirim) {
      const patch: Record<string, unknown> = {};
      if (parsed.data.featured !== undefined) patch.unggulan = parsed.data.featured;
      if (contractorDikirim) patch.contractor_id = parsed.data.contractorId ?? null;
      const { error: updateError } = await supabase
        .from("submissions")
        .update(patch)
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
      .update({ dinonaktifkan: true, unggulan: false })
      .eq("id", submission.id);
    if (error) throw new Error(`Project disable failed: ${error.message}`);

    return jsonOk({ deleted: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
