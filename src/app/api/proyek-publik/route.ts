import { connection, NextResponse } from "next/server";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekNyata } from "@/lib/proyek-nyata";

// Daftar proyek nyata ber-pin untuk peta publik /jelajah: nama, lokasi,
// koordinat, status, dan tautan dossier — semuanya data yang sudah tampil
// publik di dossier. Selalu 200: bila basis data gagal, daftar kosong dan
// peta jatuh ke dataset simulasi (mode cadangan PRD §T-28).

export async function GET() {
  await connection();
  try {
    const semua = await daftarProyekNyata(jakartaToday());
    const berpin = semua.filter((item) => item.lat !== null && item.lng !== null);
    return NextResponse.json(
      { proyek: berpin },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { proyek: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
