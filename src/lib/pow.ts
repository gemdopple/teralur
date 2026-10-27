// Bukti kerja (proof-of-work) stateless untuk laporan warga anonim. Kunci
// murni yang dipakai bersama server (verifikasi) dan klien (pemecah) —
// TANPA import node:crypto agar aman dimuat di bundle klien.

/** Bit nol yang diminta pada hash SHA-256 (16 bit = 4 digit hex depan).
 *  ~65 ribu hash rata-rata: <2 detik di peramban, cukup mahal untuk bot. */
export const KESULITAN_POW = 16;

/** Tantangan berlaku 10 menit sejak diterbitkan. */
export const MASAK_POW_MS = 10 * 60 * 1000;

/** Hitung bit nol di depan string hex (4 bit per karakter). */
export function bitNolHex(hex: string): number {
  let bit = 0;
  for (const karakter of hex) {
    const nilai = parseInt(karakter, 16);
    if (Number.isNaN(nilai)) return bit;
    if (nilai === 0) {
      bit += 4;
      continue;
    }
    if (nilai < 2) return bit + 3;
    if (nilai < 4) return bit + 2;
    if (nilai < 8) return bit + 1;
    return bit;
  }
  return bit;
}
