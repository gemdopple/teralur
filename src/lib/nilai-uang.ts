// Parser nilai uang papan (KP F-03), sesuai Lampiran D.2 PRD v1.1:
// menerima "Rp 1.234.567", "Rp. 1.234.567", "1234567", dan "1234567,00" —
// semua dinormalisasi menjadi bilangan bulat rupiah positif.
// Titik hanya diterima sebagai pemisah ribuan (1-3 digit lalu kelipatan 3 digit);
// koma adalah pemisah desimal yang dibuang (maksimal 2 digit di belakang).

export function parseNilaiUang(nilai: string): number | null {
  const s = nilai
    .trim()
    .replace(/^rp\.?\s*/i, "")
    .replace(/\s+/g, "");
  if (s === "") return null;
  const noDecimals = s.replace(/,\d{1,2}$/, ""); // buang ",00" atau ",5"
  if (!/^(\d{1,3}(\.\d{3})+|\d+)$/.test(noDecimals)) return null;
  const n = Number(noDecimals.replace(/\./g, ""));
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}
