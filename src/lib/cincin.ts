// Pure progress-ring math for a project's contract period. No DB, no network.

export type KeadaanCincin = "berjalan" | "melewati" | "tak_terhitung";

export type Cincin = {
  keadaan: KeadaanCincin;
  berjalan: number | null;
  total: number | null;
  isian: number;
};

const SATU_HARI_MS = 86_400_000;

// Dates are treated as calendar dates (UTC midnight) so day math is timezone-stable.
function keUtcTengahMalam(tanggal: string | Date): number {
  if (tanggal instanceof Date) {
    return Date.UTC(tanggal.getUTCFullYear(), tanggal.getUTCMonth(), tanggal.getUTCDate());
  }
  return new Date(`${tanggal.slice(0, 10)}T00:00:00Z`).getTime();
}

export function hitungCincin({
  masaHari,
  tanggalMulai,
  hariIni,
}: {
  masaHari: number | null;
  tanggalMulai: string | Date | null;
  hariIni: string | Date;
}): Cincin {
  if (masaHari === null || tanggalMulai === null) {
    return { keadaan: "tak_terhitung", berjalan: null, total: null, isian: 0 };
  }
  const total = masaHari;
  const berjalan = Math.floor(
    (keUtcTengahMalam(hariIni) - keUtcTengahMalam(tanggalMulai)) / SATU_HARI_MS,
  );
  const isian = total > 0 ? Math.min(berjalan / total, 1) : 0;
  return { keadaan: berjalan > total ? "melewati" : "berjalan", berjalan, total, isian };
}
