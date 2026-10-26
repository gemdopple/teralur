// Format nilai uang rupiah untuk tampilan (id-ID, tanpa desimal).
// Mengembalikan null bila nilai bukan angka berhingga agar pemanggil bisa
// menampilkan teks pengganti "Belum diketahui".
export function formatRupiah(nilai: number | null | undefined): string | null {
  if (nilai === null || nilai === undefined || !Number.isFinite(nilai)) return null;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}

/** Versi ringkas untuk kartu: Rp 1,49 M / Rp 875 jt / Rp 450 jt. */
export function formatRupiahRingkas(nilai: number | null | undefined): string | null {
  if (nilai === null || nilai === undefined || !Number.isFinite(nilai)) return null;
  if (nilai >= 1_000_000_000) {
    return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(nilai / 1_000_000_000)} M`;
  }
  if (nilai >= 1_000_000) {
    return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(nilai / 1_000_000)} jt`;
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(nilai);
}
