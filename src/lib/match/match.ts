import { MATCH_CONFIG } from "../../config/match";
import { normalisasiTeks } from "./normalisasi";
import { trigramSimilarity } from "./trigram";
import type { Papan, RecordResmi, Status } from "./types";

export class FieldKunciKurang extends Error {
  constructor(kunciTerisi: string[]) {
    super(
      `Minimal 2 dari 3 field kunci (penyedia, nama_paket, nilai_kontrak) harus terisi; ` +
        `terisi: ${kunciTerisi.length > 0 ? kunciTerisi.join(", ") : "tidak ada"}`,
    );
    this.name = "FieldKunciKurang";
  }
}

export type LulusField = { penyedia: boolean; nama: boolean; nilai: boolean };

export type KandidatHasil = {
  record: RecordResmi;
  skor: number;
  lulus: LulusField;
  selisih: string[];
};

export type HasilMatch = {
  status: Status;
  terbaik: RecordResmi | null;
  skor: number;
  daftar: KandidatHasil[];
  perluPilih: boolean;
};

type FieldTerisi = { penyedia: boolean; nama: boolean; nilai: boolean };

// Field key -> the name used in the `selisih` list.
const NAMA_FIELD: Record<keyof LulusField, string> = {
  penyedia: "penyedia",
  nama: "nama_paket",
  nilai: "nilai_kontrak",
};

const KUNCI = ["penyedia", "nama", "nilai"] as const;

function fieldTerisi(papan: Papan): FieldTerisi {
  return {
    penyedia: papan.penyedia !== null && papan.penyedia.trim() !== "",
    nama: papan.nama_paket !== null && papan.nama_paket.trim() !== "",
    nilai: papan.nilai_kontrak !== null,
  };
}

// Status for one candidate, computed on evaluated (filled) fields only.
function statusKandidat(lulus: LulusField, terisi: FieldTerisi): Status {
  let jmlDinilai = 0;
  let jmlLulus = 0;
  for (const kunci of KUNCI) {
    if (!terisi[kunci]) continue;
    jmlDinilai += 1;
    if (lulus[kunci]) jmlLulus += 1;
  }
  const gagal = jmlDinilai - jmlLulus;
  if (gagal === 0 && jmlLulus >= 2) return "cocok";
  if (gagal === 1 && jmlLulus >= 2) return "selisih";
  return "tidak_ditemukan";
}

// 1 at toleransi, decreasing linearly to 0 at nolPada.
function nilaiTerm(selisihRelatif: number): number {
  const { toleransi, nolPada } = MATCH_CONFIG.nilai;
  if (selisihRelatif <= toleransi) return 1;
  return Math.max(0, 1 - (selisihRelatif - toleransi) / (nolPada - toleransi));
}

function evaluasiKandidat(papan: Papan, record: RecordResmi, terisi: FieldTerisi): KandidatHasil {
  const lulus: LulusField = { penyedia: false, nama: false, nilai: false };
  const selisih: string[] = [];
  let skor = 0;

  if (terisi.penyedia) {
    const sim = trigramSimilarity(
      normalisasiTeks(papan.penyedia ?? ""),
      normalisasiTeks(record.penyedia ?? ""),
    );
    lulus.penyedia = sim >= MATCH_CONFIG.penyedia.lulus;
    skor += MATCH_CONFIG.penyedia.bobot * sim;
    if (!lulus.penyedia) selisih.push(NAMA_FIELD.penyedia);
  }
  if (terisi.nama) {
    const sim = trigramSimilarity(
      normalisasiTeks(papan.nama_paket ?? ""),
      normalisasiTeks(record.nama_paket),
    );
    lulus.nama = sim >= MATCH_CONFIG.nama.lulus;
    skor += MATCH_CONFIG.nama.bobot * sim;
    if (!lulus.nama) selisih.push(NAMA_FIELD.nama);
  }
  if (terisi.nilai && papan.nilai_kontrak !== null) {
    const nilaiRecord = record.nilai_kontrak;
    // Relative difference against the official record; 0/0 counts as equal.
    const beda =
      nilaiRecord === 0
        ? papan.nilai_kontrak === 0
          ? 0
          : Number.POSITIVE_INFINITY
        : Math.abs(papan.nilai_kontrak - nilaiRecord) / Math.abs(nilaiRecord);
    const term = nilaiTerm(beda);
    lulus.nilai = beda <= MATCH_CONFIG.nilai.toleransi;
    skor += MATCH_CONFIG.nilai.bobot * term;
    if (!lulus.nilai) selisih.push(NAMA_FIELD.nilai);
  }

  return { record, skor, lulus, selisih };
}

export function match(papan: Papan, kandidat: RecordResmi[]): HasilMatch {
  const terisi = fieldTerisi(papan);
  const kunciTerisi = KUNCI.filter((k) => terisi[k]).map((k) => NAMA_FIELD[k]);
  if (kunciTerisi.length < 2) {
    throw new FieldKunciKurang(kunciTerisi);
  }

  // Score sums only the evaluated fields' weights; fields not filled on the signboard
  // contribute nothing (no renormalization). Keep candidates at/above kandidatMin,
  // best first, capped at kandidatMaks.
  const daftar = kandidat
    .map((record) => evaluasiKandidat(papan, record, terisi))
    .filter((k) => k.skor >= MATCH_CONFIG.kandidatMin)
    .sort((a, b) => b.skor - a.skor)
    .slice(0, MATCH_CONFIG.kandidatMaks);

  if (daftar.length === 0) {
    return { status: "tidak_ditemukan", terbaik: null, skor: 0, daftar: [], perluPilih: false };
  }

  const terbaik = daftar[0];
  const status = statusKandidat(terbaik.lulus, terisi);

  const kedua: KandidatHasil | undefined = daftar[1];
  const layak = (s: Status) => s === "cocok" || s === "selisih";
  const perluPilih =
    kedua !== undefined &&
    layak(status) &&
    layak(statusKandidat(kedua.lulus, terisi)) &&
    Math.abs(terbaik.skor - kedua.skor) < MATCH_CONFIG.seriBeda;

  return { status, terbaik: terbaik.record, skor: terbaik.skor, daftar, perluPilih };
}
