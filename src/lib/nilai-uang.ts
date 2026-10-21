// Parser nilai uang papan (KP F-03): menerima "Rp 1.234.567", "1234567",
// dan "1234567,00" — semua dinormalisasi menjadi bilangan bulat rupiah.
// Titik adalah pemisah ribuan; koma adalah pemisah desimal (dibuang).

export function parseNilaiUang(nilai: string): number | null {
  const bersih = nilai.replace(/rp/gi, "").replace(/\s/g, "");
  if (bersih === "") return null;
  const koma = bersih.indexOf(",");
  const bagianBulat = (koma === -1 ? bersih : bersih.slice(0, koma)).replace(/\./g, "");
  if (!/^\d+$/.test(bagianBulat)) return null;
  const angka = Number(bagianBulat);
  return Number.isSafeInteger(angka) ? angka : null;
}
