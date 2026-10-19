// Text and number normalization for matching. Pure functions only — no DB, no network.

// Generic words that carry no signal on a signboard or package name; removed during
// normalization. Extend here as new noise shows up in the gold set.
export const KATA_UMUM: readonly string[] = [
  "pt",
  "cv",
  "ud",
  "pekerjaan",
  "paket",
  "pengadaan",
  "kegiatan",
  "tahun",
  "anggaran",
];

// Abbreviation map: signboard shorthand -> expanded form. Keep every expansion in this
// single exported constant so the map can grow in one place.
export const SINGKATAN: Record<string, string> = {
  jl: "jalan",
  ds: "desa",
  kec: "kecamatan",
  kab: "kabupaten",
  rehab: "rehabilitasi",
};

export function normalisasiTeks(teks: string): string {
  const bersih = teks
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  if (bersih === "") return "";
  const diperluas = bersih.split(/\s+/).map((kata) => SINGKATAN[kata] ?? kata);
  return diperluas.filter((kata) => !KATA_UMUM.includes(kata)).join(" ");
}

export function normalisasiAngka(nilai: string | number): number | null {
  if (typeof nilai === "number") return Number.isFinite(nilai) ? nilai : null;
  const bersih = nilai.replace(/rp/gi, "").replace(/[.,\s]/g, "");
  if (bersih === "") return null;
  const angka = Number(bersih);
  return Number.isFinite(angka) ? angka : null;
}
