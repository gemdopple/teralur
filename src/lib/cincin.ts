// Pure progress-ring math for a project's contract period. No DB, no network.

export type KeadaanCincin = "berjalan" | "melewati" | "tak_terhitung";

export type Cincin = {
  keadaan: KeadaanCincin;
  berjalan: number | null;
  total: number | null;
  isian: number;
};

// Input papan (isian yang dikonfirmasi pengguna, field API camelCase).
export type PapanCincin = {
  durationDays?: number | null;
  contractDate?: string | null;
};

// Input catatan resmi (kolom internal bahasa Indonesia).
export type CatatanCincin = {
  masa_hari?: number | null;
  tanggal_kontrak?: string | null;
};

// Presedensi fallback §6.5:
// total = durationDays papan, bila null masa_hari catatan, bila keduanya null tidak terhitung;
// mulai = tanggal_kontrak catatan, bila null contractDate papan, bila keduanya null tidak terhitung.
export function inputCincin(
  papan: PapanCincin | null,
  catatan: CatatanCincin | null,
): { masaHari: number | null; tanggalMulai: string | null } {
  const masaHari = papan?.durationDays ?? catatan?.masa_hari ?? null;
  const tanggalMulai = catatan?.tanggal_kontrak ?? papan?.contractDate ?? null;
  return { masaHari, tanggalMulai };
}

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
  // Masa tidak positif berarti tidak dapat dihitung (§6.5 "tidak dapat dihitung"),
  // sekaligus mencegah pembagian dengan nol dan cincin yang terisi.
  if (masaHari === null || masaHari <= 0 || tanggalMulai === null) {
    return { keadaan: "tak_terhitung", berjalan: null, total: null, isian: 0 };
  }
  const total = masaHari;
  const berjalan = Math.max(
    0,
    Math.floor((keUtcTengahMalam(hariIni) - keUtcTengahMalam(tanggalMulai)) / SATU_HARI_MS),
  );
  const isian = Math.min(berjalan / total, 1);
  return { keadaan: berjalan > total ? "melewati" : "berjalan", berjalan, total, isian };
}
