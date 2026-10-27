import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { KESULITAN_POW, MASAK_POW_MS, bitNolHex } from "./pow";

// Sisi server bukti kerja: tantangan stateless HMAC (tidak perlu penyimpanan)
// dan verifikasi nonce. Kunci HMAC memakai IP_HASH_SALT yang sudah wajib ada
// di rute laporan — tanpa itu rute fail-closed 503 sebelum sampai ke sini.

function kunciHmac(): string {
  return process.env.IP_HASH_SALT ?? "";
}

function tandaTangan(ts: string): string {
  return createHmac("sha256", kunciHmac()).update(`pow:${ts}`).digest("hex");
}

/** Terbitkan tantangan baru: `<timestamp>.<hmac>` + tingkat kesulitan. */
export function tantanganPoW(saatIni = Date.now()): {
  tantangan: string;
  kesulitan: number;
} {
  const ts = String(saatIni);
  return { tantangan: `${ts}.${tandaTangan(ts)}`, kesulitan: KESULITAN_POW };
}

/** Verifikasi bukti: bentuk, HMAC, kesegaran, dan bit nol cukup. */
export function verifikasiPoW(
  tantangan: string,
  nonce: string,
  kesulitan = KESULITAN_POW,
  saatIni = Date.now(),
): boolean {
  const cocok = /^(\d+)\.([0-9a-f]{64})$/.exec(tantangan);
  if (!cocok) return false;
  if (!/^[0-9a-f]{1,16}$/.test(nonce)) return false;

  const [, ts, tanda] = cocok;
  const ekspektasi = Buffer.from(tandaTangan(ts), "hex");
  const diterima = Buffer.from(tanda, "hex");
  if (ekspektasi.length !== diterima.length || !timingSafeEqual(ekspektasi, diterima)) {
    return false;
  }
  if (Math.abs(saatIni - Number(ts)) > MASAK_POW_MS) return false;

  const hash = createHash("sha256").update(`${tantangan}:${nonce}`).digest("hex");
  return bitNolHex(hash) >= kesulitan;
}
