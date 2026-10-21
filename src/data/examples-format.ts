// Helper format kecil untuk halaman contoh (data statis, tanpa server-api).
export function formatRupiahContoh(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
