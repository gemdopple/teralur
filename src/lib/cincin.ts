// Pure progress-ring math for a project's contract period. No DB, no network.
import { daysBetween, formatTanggal } from "./dates";

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

// ---------------------------------------------------------------------------
// Cincin waktu lengkap Lampiran G.1 (PRD v1.1) — masukan publik API (E.11),
// nama field bahasa Inggris. Fungsi v1.0 di atas tidak diubah (jalur foto beku).

export type RingState = "running" | "over" | "unknown" | "not_started";

export interface TimeRing {
  state: RingState;
  elapsedDays: number | null;
  totalDays: number | null;
  overDays: number | null;
  fillRatio: number; // 0..1
  startDate: string | null;
  startSource: "record" | "board" | null;
  totalSource: "board" | "record" | null;
  centerText: string;
  caption: string;
}

export const RING_NOTE = "Ini waktu yang telah berjalan, bukan kemajuan fisik.";

export interface RingInput {
  boardDurationDays: number | null;
  recordDurationDays: number | null;
  boardContractDate: string | null;
  recordContractDate: string | null;
  today: string; // TTTT-BB-HH, WIB, dari jakartaToday()
}

const CAPTION_TANPA_TANGGAL = "Tanggal mulai tidak tersedia";
const CAPTION_TANPA_MASA = "Masa pelaksanaan tidak tersedia";

// Presedensi G.1: total = masa papan → masa catatan resmi;
// mulai = tanggal kontrak catatan resmi → tanggal kontrak papan.
export function computeTimeRing(input: RingInput): TimeRing {
  const {
    boardDurationDays,
    recordDurationDays,
    boardContractDate,
    recordContractDate,
    today,
  } = input;

  // Rule 1: total dari papan bila ada, jika tidak dari catatan resmi.
  // Masa ≤ 0 diperlakukan tidak tersedia (mencegah pembagian nol, seperti v1.0).
  const total: number | null =
    boardDurationDays !== null && boardDurationDays > 0
      ? boardDurationDays
      : recordDurationDays !== null && recordDurationDays > 0
        ? recordDurationDays
        : null;
  const totalSource: "board" | "record" | null =
    total === null ? null : boardDurationDays !== null && boardDurationDays > 0 ? "board" : "record";

  // Rule 2: mulai dari catatan resmi bila ada, jika tidak dari papan.
  const start: string | null = recordContractDate ?? boardContractDate;
  const startSource: "record" | "board" | null =
    start === null ? null : recordContractDate !== null ? "record" : "board";

  // Rule 3: tanpa tanggal mulai → unknown.
  if (start === null) {
    return {
      state: "unknown",
      elapsedDays: null,
      totalDays: total,
      overDays: null,
      fillRatio: 0,
      startDate: null,
      startSource: null,
      totalSource,
      centerText: "–",
      caption: CAPTION_TANPA_TANGGAL,
    };
  }

  // Rule 4: mulai ada tetapi masa kosong → unknown (C-02).
  if (total === null) {
    return {
      state: "unknown",
      elapsedDays: null,
      totalDays: null,
      overDays: null,
      fillRatio: 0,
      startDate: start,
      startSource,
      totalSource: null,
      centerText: "–",
      caption: CAPTION_TANPA_MASA,
    };
  }

  const elapsed = daysBetween(start, today);

  // Rule 5: belum dimulai (C-01).
  if (elapsed < 0) {
    return {
      state: "not_started",
      elapsedDays: 0,
      totalDays: total,
      overDays: null,
      fillRatio: 0,
      startDate: start,
      startSource,
      totalSource,
      centerText: `0/${total}`,
      caption: `Belum dimulai. Tanggal mulai tercatat ${formatTanggal(start)}.`,
    };
  }

  // Rule 6: berjalan (0 ≤ elapsed ≤ total; tepat di batas tetap running).
  if (elapsed <= total) {
    return {
      state: "running",
      elapsedDays: elapsed,
      totalDays: total,
      overDays: null,
      fillRatio: elapsed / total,
      startDate: start,
      startSource,
      totalSource,
      centerText: `${elapsed}/${total}`,
      caption: `Hari ke-${elapsed} dari ${total}`,
    };
  }

  // Rule 7: melewati masa kontrak tercatat. Kata "terlambat" tidak dipakai.
  const overDays = elapsed - total;
  return {
    state: "over",
    elapsedDays: elapsed,
    totalDays: total,
    overDays,
    fillRatio: 1,
    startDate: start,
    startSource,
    totalSource,
    centerText: `${total}/${total}`,
    caption: `Melewati masa kontrak tercatat ${overDays} hari. Addendum atau perpanjangan mungkin ada.`,
  };
}
