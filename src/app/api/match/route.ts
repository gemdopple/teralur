import { NextResponse } from "next/server";
import {
  boardToInternal,
  discrepancyFieldToApi,
  matchRequestSchema,
  statusToApi,
} from "@/lib/api-contract";
import { match, FieldKunciKurang } from "@/lib/match/match";
import type { RecordResmi } from "@/lib/match/types";
import { getSupabaseAdmin } from "@/lib/db";
import { photoFlowEnabled } from "@/lib/flags";
import {
  consumeRateLimit,
  createPublicSlug,
  databaseConfigured,
  findRecordCandidates,
  ipRateKey,
  readJsonBody,
  recordToApi,
  requestIp,
} from "@/lib/server-api";

export async function POST(request: Request) {
  // Jalur foto dibekukan (PRD v1.1, Lampiran B.3): bila flag mati, /api/match
  // tidak tersedia dan mengembalikan 404, bukan hasil pencocokan.
  if (!photoFlowEnabled()) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Endpoint tidak ditemukan." },
      { status: 404 },
    );
  }
  // Pencocokan memanggil model AI — mahal, jadi dibatasi per IP seperti
  // /api/extract (10/jam).
  let ip: string | null = null;
  try {
    ip = await requestIp();
  } catch {
    // header IP tidak tersedia — lewati batas IP
  }
  if (ip) {
    const allowed = await consumeRateLimit(`match:${ipRateKey(ip)}`, 10);
    if (!allowed) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Batas pencocokan per jam tercapai. Coba lagi nanti." },
        { status: 429 },
      );
    }
  }
  const body = await readJsonBody(request);
  if (!body.valid) {
    return NextResponse.json({ error: "INVALID_JSON", message: "Isi permintaan tidak valid." }, { status: 400 });
  }
  const parsed = matchRequestSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "Periksa kembali field papan yang dikirim." },
      { status: 400 },
    );
  }

  const { board } = parsed.data;
  const jumlahFieldKunci = [
    board.packageName?.trim(),
    board.supplier?.trim(),
    board.contractValue,
  ].filter((value) => value !== null && value !== undefined && value !== "").length;
  if (jumlahFieldKunci < 2) {
    return NextResponse.json(
      {
        error: "INSUFFICIENT_KEY_FIELDS",
        message: "Isi minimal 2 dari 3 field kunci: nama paket, penyedia, dan nilai kontrak.",
      },
      { status: 422 },
    );
  }

  if (!databaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_NOT_CONFIGURED", message: "Proyek belum terhubung ke basis data." },
      { status: 503 },
    );
  }

  const rows = await findRecordCandidates(board);
  const records: RecordResmi[] = rows.map((row) => ({
    id: row.id,
    nama_paket: row.nama_paket,
    penyedia: row.penyedia,
    nilai_kontrak: Number(row.nilai_kontrak),
    tanggal_kontrak: row.tanggal_kontrak,
    masa_hari: row.masa_hari,
    tahun: row.tahun,
  }));

  let result;
  try {
    result = match(boardToInternal(board), records);
  } catch (error) {
    if (error instanceof FieldKunciKurang) {
      return NextResponse.json(
        { error: "INSUFFICIENT_KEY_FIELDS", message: error.message },
        { status: 422 },
      );
    }
    throw error;
  }

  const slug = createPublicSlug();
  const submission = {
    slug,
    jenis: "foto",
    papan: boardToInternal(board),
    record_id: result.terbaik?.id ?? null,
    status: result.status,
    skor: result.skor,
    kandidat: {
      requiresSelection: result.perluPilih,
      candidates: result.daftar.map((candidate) => ({
        recordId: candidate.record.id,
        score: candidate.skor,
        passed: candidate.lulus,
        discrepancies: candidate.selisih,
      })),
    },
    demo: false,
  };
  const { error } = await getSupabaseAdmin().from("submissions").insert(submission);
  if (error) {
    console.error("Unable to save matching submission:", error.message);
    return NextResponse.json(
      { error: "SUBMISSION_SAVE_FAILED", message: "Hasil belum dapat disimpan. Coba lagi nanti." },
      { status: 502 },
    );
  }

  const candidateResponses = result.daftar.flatMap((candidate) => {
    const row = rows.find((record) => record.id === candidate.record.id);
    return row
      ? [
          {
            ...recordToApi(row),
            score: candidate.skor,
            passed: {
              supplier: candidate.lulus.penyedia,
              packageName: candidate.lulus.nama,
              contractValue: candidate.lulus.nilai,
            },
            discrepancies: candidate.selisih.map(discrepancyFieldToApi),
          },
        ]
      : [];
  });

  return NextResponse.json({
    slug,
    status: statusToApi(result.status),
    candidates: candidateResponses,
    discrepancies: result.daftar[0]?.selisih.map(discrepancyFieldToApi) ?? [],
    requiresSelection: result.perluPilih,
  });
}
