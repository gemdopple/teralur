import { NextResponse } from "next/server";
import { tantanganPoW } from "@/lib/pow-server";
import { consumeRateLimit, ipRateKey, requestIp } from "@/lib/server-api";

// Terbitkan tantangan bukti kerja untuk laporan warga anonim. Stateful tidak
// perlu: tantangan = `<timestamp>.<hmac>` sehingga verifikasi cukup hitung
// ulang HMAC. Dibatasi per IP agar tantangan tidak dibanjirkan juga.

export async function GET() {
  if (!process.env.IP_HASH_SALT) {
    return NextResponse.json(
      { error: "RATE_LIMIT_NOT_CONFIGURED", message: "Laporan belum tersedia karena pembatasan belum dikonfigurasi." },
      { status: 503 },
    );
  }
  let ip: string | null = null;
  try {
    ip = await requestIp();
  } catch {
    // header IP tidak tersedia — lewati batas IP, tantangan tetap terbit
  }
  if (ip) {
    const allowed = await consumeRateLimit(`pow:${ipRateKey(ip)}`, 120);
    if (!allowed) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Terlalu banyak permintaan tantangan. Coba lagi nanti." },
        { status: 429 },
      );
    }
  }
  return NextResponse.json(tantanganPoW(), {
    headers: { "cache-control": "no-store" },
  });
}
