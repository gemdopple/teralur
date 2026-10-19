import { NextResponse } from "next/server";
import { databaseConfigured, recordToApi, searchRecords } from "@/lib/server-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const yearText = searchParams.get("year");
  const year = yearText === null ? null : Number(yearText);
  if (!query || query.length > 120 || (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2200))) {
    return NextResponse.json(
      { error: "INVALID_QUERY", message: "Masukkan kata kunci dan tahun yang valid." },
      { status: 400 },
    );
  }

  if (!databaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_NOT_CONFIGURED", message: "Pencarian belum tersedia karena basis data belum dikonfigurasi." },
      { status: 503 },
    );
  }

  const rows = await searchRecords(query, year);
  return NextResponse.json({ results: rows.map(recordToApi) });
}
