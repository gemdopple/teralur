import { NextResponse } from "next/server";
import { z } from "zod";
import {
  boardToApi,
  discrepancyFieldToApi,
  dossierStatusToApi,
  statusToApi,
  storedBoardSchema,
} from "@/lib/api-contract";
import { databaseConfigured, getDossier, readJsonBody } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";
import { match } from "@/lib/match/match";
import type { Status } from "@/lib/match/types";

const INTERNAL_STATUSES: Record<string, Status | undefined> = {
  cocok: "cocok",
  selisih: "selisih",
  tidak_ditemukan: "tidak_ditemukan",
};

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!databaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_NOT_CONFIGURED", message: "Dossier belum tersedia karena basis data belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const dossier = await getDossier(slug);
  if (!dossier) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Dossier tidak ditemukan." }, { status: 404 });
  }

  const { submission, record, visitCounts, candidates, requiresSelection } = dossier;
  const boardResult =
    submission.papan === null ? null : storedBoardSchema.safeParse(submission.papan);
  const internalStatus =
    submission.status === "catatan_resmi"
      ? "catatan_resmi"
      : INTERNAL_STATUSES[submission.status ?? ""];
  if ((boardResult !== null && !boardResult.success) || !internalStatus) {
    console.error("Stored dossier has an invalid board or status:", slug);
    return NextResponse.json(
      { error: "INVALID_STORED_DOSSIER", message: "Data dossier tidak valid dan perlu diperiksa tim." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    slug: submission.slug,
    status: dossierStatusToApi(internalStatus),
    board: boardResult?.success ? boardToApi(boardResult.data) : null,
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
    visitCounts,
    createdAt: submission.dibuat,
    demo: submission.demo,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await readJsonBody(request);
  if (!body.valid) {
    return NextResponse.json({ error: "INVALID_JSON", message: "Isi permintaan tidak valid." }, { status: 400 });
  }
  const recordId = z.string().uuid().safeParse(
    typeof body.value === "object" && body.value !== null && "recordId" in body.value
      ? body.value.recordId
      : undefined,
  );
  if (!recordId.success) {
    return NextResponse.json({ error: "INVALID_RECORD", message: "Pilih kandidat yang valid." }, { status: 400 });
  }

  if (!databaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_NOT_CONFIGURED", message: "Pencocokan belum tersedia karena basis data belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const dossier = await getDossier(slug);
  if (!dossier) {
    return NextResponse.json({ error: "NOT_FOUND", message: "Dossier tidak ditemukan." }, { status: 404 });
  }
  const boardResult = storedBoardSchema.safeParse(dossier.submission.papan);
  if (!boardResult.success || dossier.submission.jenis !== "foto") {
    return NextResponse.json(
      { error: "CANDIDATE_SELECTION_UNAVAILABLE", message: "Dossier ini tidak memiliki kandidat papan untuk dipilih." },
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
