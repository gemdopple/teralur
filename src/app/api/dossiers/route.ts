import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured, createPublicSlug, readJsonBody } from "@/lib/server-api";

const createDossierSchema = z.object({ recordId: z.string().uuid() });

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.valid) {
    return NextResponse.json({ error: "INVALID_JSON", message: "Isi permintaan tidak valid." }, { status: 400 });
  }
  const parsed = createDossierSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "Pilih catatan resmi yang valid." },
      { status: 400 },
    );
  }

  if (!databaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_NOT_CONFIGURED", message: "Dossier belum tersedia karena basis data belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: record, error: recordError } = await supabase
    .from("records")
    .select("id")
    .eq("id", parsed.data.recordId)
    .maybeSingle();
  if (recordError) {
    console.error("Unable to look up official record:", recordError.message);
    return NextResponse.json(
      { error: "RECORD_LOOKUP_FAILED", message: "Catatan resmi belum dapat dimuat." },
      { status: 502 },
    );
  }
  if (!record) {
    return NextResponse.json(
      { error: "NOT_FOUND", message: "Catatan resmi tidak ditemukan." },
      { status: 404 },
    );
  }

  const slug = createPublicSlug();
  const { error } = await supabase.from("submissions").insert({
    slug,
    jenis: "cari",
    papan: null,
    record_id: record.id,
    status: "catatan_resmi",
    skor: null,
    kandidat: { requiresSelection: false, candidates: [] },
    demo: false,
  });
  if (error) {
    console.error("Unable to create official-record dossier:", error.message);
    return NextResponse.json(
      { error: "DOSSIER_CREATE_FAILED", message: "Dossier belum dapat dibuat. Coba lagi nanti." },
      { status: 502 },
    );
  }

  return NextResponse.json({ slug, status: "official_record" }, { status: 201 });
}
