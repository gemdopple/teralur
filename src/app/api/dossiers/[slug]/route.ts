import { NextResponse } from "next/server";
import { z } from "zod";
import {
  boardToApi,
  discrepancyFieldToApi,
  dossierStatusToApi,
  statusToApi,
  storedBoardSchema,
} from "@/lib/api-contract";
import { compare } from "@/lib/compare";
import { jakartaToday } from "@/lib/dates";
import { computeTimeRing } from "@/lib/cincin";
import { databaseConfigured, getDossier, readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";
import { photoFlowEnabled } from "@/lib/flags";
import { match } from "@/lib/match/match";
import type { Status } from "@/lib/match/types";

const INTERNAL_STATUSES: Record<string, Status | undefined> = {
  cocok: "cocok",
  selisih: "selisih",
  tidak_ditemukan: "tidak_ditemukan",
};

// Selisih nilai kontrak dibulatkan 4 desimal (E.11). Non-finite (nilai resmi 0)
// dipetakan ke null agar JSON tetap valid.
function relativeDifferenceToApi(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.round(value * 10_000) / 10_000;
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!databaseConfigured()) {
    return NextResponse.json(
      {
        error: "DATABASE_NOT_CONFIGURED",
        message: "Dossier belum tersedia karena basis data belum dikonfigurasi.",
      },
      { status: 503 },
    );
  }

  const dossier = await getDossier(slug);
  if (!dossier) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Dossier tidak ditemukan." },
      { status: 404 },
    );
  }

  const { submission, record, visitCounts, candidates, requiresSelection, resources } = dossier;
  const boardResult =
    submission.papan === null ? null : storedBoardSchema.safeParse(submission.papan);
  const internalStatus =
    submission.status === "catatan_resmi"
      ? "catatan_resmi"
      : INTERNAL_STATUSES[submission.status ?? ""];
  if ((boardResult !== null && !boardResult.success) || !internalStatus) {
    console.error("Stored dossier has an invalid board or status:", slug);
    return NextResponse.json(
      {
        error: "INVALID_STORED_DOSSIER",
        message: "Data dossier tidak valid dan perlu diperiksa tim.",
      },
      { status: 500 },
    );
  }
  const board = boardResult?.success ? boardToApi(boardResult.data) : null;

  // Cincin waktu (G.1) dihitung server dengan hari ini WIB; presedensi
  // total: papan → catatan resmi, mulai: catatan resmi → papan.
  const timeRing = computeTimeRing({
    boardDurationDays: board?.durationDays ?? null,
    recordDurationDays: record?.masa_hari ?? null,
    boardContractDate: board?.executionStartDate ?? board?.contractDate ?? null,
    recordContractDate: record?.tanggal_kontrak ?? null,
    today: jakartaToday(),
  });

  // Selisih (E.11): hanya komponen kunci yang tidak lulus, dihitung ulang server
  // untuk proyek admin. Jalur foto beku tetap memakai kandidat/requiresSelection.
  let discrepancies: Array<{
    field: string;
    boardValue: string | number;
    recordValue: string | number;
    relativeDifference?: number | null;
    similarity?: number | null;
  }> = [];
  if (submission.jenis === "admin" && board && record) {
    discrepancies = compare(board, {
      packageName: record.nama_paket,
      supplier: record.penyedia,
      contractValue: Number(record.nilai_kontrak),
    }).discrepancies.map((component) => ({
      field: component.field,
      boardValue: component.boardValue,
      recordValue: component.recordValue,
      ...(component.field === "contractValue"
        ? { relativeDifference: relativeDifferenceToApi(component.relativeDifference) }
        : { similarity: component.similarity }),
    }));
  }

  const basis = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";

  return NextResponse.json({
    slug: submission.slug,
    status: dossierStatusToApi(internalStatus),
    board,
    record: record
      ? {
          id: record.id,
          sourceId: record.id_sumber,
          source: record.sumber,
          packageName: record.nama_paket,
          supplier: record.penyedia,
          contractValue: Number(record.nilai_kontrak),
          contractDate: record.tanggal_kontrak,
          durationDays: record.masa_hari,
          fiscalYear: record.tahun,
          agencyUnit: record.satuan_kerja,
          snapshotDate: record.snapshot_tanggal,
        }
      : null,
    candidates: candidates.map((candidate) => ({
      id: candidate.record.id,
      sourceId: candidate.record.id_sumber,
      source: candidate.record.sumber,
      packageName: candidate.record.nama_paket,
      supplier: candidate.record.penyedia,
      contractValue: Number(candidate.record.nilai_kontrak),
      contractDate: candidate.record.tanggal_kontrak,
      durationDays: candidate.record.masa_hari,
      fiscalYear: candidate.record.tahun,
      agencyUnit: candidate.record.satuan_kerja,
      snapshotDate: candidate.record.snapshot_tanggal,
      score: candidate.score,
      passed: {
        supplier: candidate.passed.penyedia,
        packageName: candidate.passed.nama,
        contractValue: candidate.passed.nilai,
      },
      discrepancies: candidate.discrepancies.map(discrepancyFieldToApi),
      selected: candidate.record.id === record?.id,
    })),
    requiresSelection,
    discrepancies,
    timeRing,
    resources: resources.map((row) => ({
      id: row.id,
      kind: row.jenis,
      title: row.judul,
      url: `${basis}/storage/v1/object/public/resources/${row.path_penyimpanan}`,
      createdAt: row.dibuat,
    })),
    featured: submission.unggulan,
    visitCounts,
    createdAt: submission.dibuat,
    updatedAt: submission.diperbarui,
    demo: submission.demo,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  // Jalur foto dibekukan (PRD v1.1, Lampiran B.3): pemilihan kandidat hanya
  // relevan untuk jalur foto; bila flag mati, kembalikan 404 NOT_FOUND.
  if (!photoFlowEnabled()) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Dossier tidak ditemukan." },
      { status: 404 },
    );
  }
  const { slug } = await params;
  const body = await readJsonBody(request);
  if (!body.valid) {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Isi permintaan tidak valid." },
      { status: 400 },
    );
  }
  const recordId = z
    .string()
    .uuid()
    .safeParse(
      typeof body.value === "object" && body.value !== null && "recordId" in body.value
        ? body.value.recordId
        : undefined,
    );
  if (!recordId.success) {
    return NextResponse.json(
      { error: "INVALID_RECORD", message: "Pilih kandidat yang valid." },
      { status: 400 },
    );
  }

  if (!databaseConfigured()) {
    return NextResponse.json(
      {
        error: "DATABASE_NOT_CONFIGURED",
        message: "Pencocokan belum tersedia karena basis data belum dikonfigurasi.",
      },
      { status: 503 },
    );
  }

  const dossier = await getDossier(slug);
  if (!dossier) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Dossier tidak ditemukan." },
      { status: 404 },
    );
  }
  const boardResult = storedBoardSchema.safeParse(dossier.submission.papan);
  if (!boardResult.success || dossier.submission.jenis !== "foto") {
    return NextResponse.json(
      {
        error: "CANDIDATE_SELECTION_UNAVAILABLE",
        message: "Dossier ini tidak memiliki kandidat papan untuk dipilih.",
      },
      { status: 422 },
    );
  }
  const candidate = dossier.candidates.find((item) => item.recordId === recordId.data);
  if (!candidate) {
    return NextResponse.json(
      { error: "INVALID_CANDIDATE", message: "Kandidat tersebut bukan bagian dari dossier ini." },
      { status: 422 },
    );
  }

  const updated = match(boardResult.data, [
    {
      id: candidate.record.id,
      nama_paket: candidate.record.nama_paket,
      penyedia: candidate.record.penyedia,
      nilai_kontrak: Number(candidate.record.nilai_kontrak),
      tanggal_kontrak: candidate.record.tanggal_kontrak,
      masa_hari: candidate.record.masa_hari,
      tahun: candidate.record.tahun,
    },
  ]);
  const { error } = await getSupabaseAdmin()
    .from("submissions")
    .update({ record_id: candidate.record.id, status: updated.status, skor: updated.skor })
    .eq("slug", slug);
  if (error) {
    console.error("Unable to update selected dossier candidate:", error.message);
    return NextResponse.json(
      { error: "CANDIDATE_UPDATE_FAILED", message: "Pilihan kandidat belum dapat disimpan." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    slug,
    status: statusToApi(updated.status),
    selectedRecordId: candidate.record.id,
    discrepancies: updated.daftar[0]?.selisih.map(discrepancyFieldToApi) ?? [],
  });
}
