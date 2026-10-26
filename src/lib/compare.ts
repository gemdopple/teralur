// Pure signboard-vs-official-record comparison per PRD Lampiran F.3 (T-38).
// No DB, no I/O, no mutation of inputs. Thresholds and weights are read from
// src/config/match.ts (MATCH_CONFIG) — never hardcoded.

import { MATCH_CONFIG } from "../config/match";
import { normalisasiTeks } from "./match/normalisasi";
import { trigramSimilarity } from "./match/trigram";

export type Status = "matched" | "discrepancy" | "not_found";
export type KeyField = "supplier" | "packageName" | "contractValue";

export interface BoardLike {
  packageName: string | null;
  supplier: string | null;
  contractValue: number | null;
}

export interface Component {
  field: KeyField;
  pass: boolean;
  similarity: number | null; // untuk teks, 0..1
  relativeDifference: number | null; // untuk nilai kontrak
  boardValue: string | number;
  recordValue: string | number;
  unitScore: number; // 0..1, untuk skor gabungan
}

export interface CompareResult {
  status: Status;
  components: Component[]; // hanya yang terevaluasi
  discrepancies: Component[]; // komponen kunci yang tidak lulus
  score: number; // informasional, 0..1
}

// A text field counts as filled only when it has non-whitespace content
// (same rule as src/lib/match/match.ts). The order of components is fixed:
// supplier, packageName, contractValue.
const teksTerisi = (v: string | null | undefined): v is string =>
  typeof v === "string" && v.trim() !== "";

function komponenPenyedia(board: BoardLike, record: BoardLike): Component | null {
  if (!teksTerisi(board.supplier) || !teksTerisi(record.supplier)) return null;
  const similarity = trigramSimilarity(
    normalisasiTeks(board.supplier),
    normalisasiTeks(record.supplier),
  );
  return {
    field: "supplier",
    pass: similarity >= MATCH_CONFIG.penyedia.lulus,
    similarity,
    relativeDifference: null,
    boardValue: board.supplier,
    recordValue: record.supplier,
    unitScore: similarity,
  };
}

function komponenNamaPaket(board: BoardLike, record: BoardLike): Component | null {
  if (!teksTerisi(board.packageName) || !teksTerisi(record.packageName)) return null;
  const similarity = trigramSimilarity(
    normalisasiTeks(board.packageName),
    normalisasiTeks(record.packageName),
  );
  return {
    field: "packageName",
    pass: similarity >= MATCH_CONFIG.nama.lulus,
    similarity,
    relativeDifference: null,
    boardValue: board.packageName,
    recordValue: record.packageName,
    unitScore: similarity,
  };
}

// Relative difference against the official record (C-10): |board − record| / record.
// unitScore is 1 at ≤ toleransi and decreases linearly to 0 at nolPada (0.20).
function komponenNilaiKontrak(board: BoardLike, record: BoardLike): Component | null {
  if (
    typeof board.contractValue !== "number" ||
    !Number.isFinite(board.contractValue) ||
    typeof record.contractValue !== "number" ||
    !Number.isFinite(record.contractValue)
  ) {
    return null;
  }
  const relativeDifference =
    record.contractValue === 0
      ? Number.POSITIVE_INFINITY
      : Math.abs(board.contractValue - record.contractValue) / record.contractValue;
  const { toleransi, nolPada } = MATCH_CONFIG.nilai;
  const unitScore =
    relativeDifference <= toleransi
      ? 1
      : Math.max(0, Math.min(1, 1 - (relativeDifference - toleransi) / (nolPada - toleransi)));
  return {
    field: "contractValue",
    pass: relativeDifference <= toleransi,
    similarity: null,
    relativeDifference,
    boardValue: board.contractValue,
    recordValue: record.contractValue,
    unitScore,
  };
}

export function compare(board: BoardLike, record: BoardLike): CompareResult {
  const components: Component[] = [];
  for (const komponen of [
    komponenPenyedia(board, record),
    komponenNamaPaket(board, record),
    komponenNilaiKontrak(board, record),
  ]) {
    if (komponen !== null) components.push(komponen);
  }

  const evaluated = components.length;
  const failed = components.filter((c) => !c.pass);
  const passed = evaluated - failed.length;

  let status: Status;
  if (evaluated < 2) {
    status = "not_found";
  } else if (failed.length === 0) {
    status = "matched";
  } else if (failed.length === 1 && passed >= 2) {
    status = "discrepancy";
  } else {
    status = "not_found";
  }

  const bobot: Record<KeyField, number> = {
    supplier: MATCH_CONFIG.penyedia.bobot,
    packageName: MATCH_CONFIG.nama.bobot,
    contractValue: MATCH_CONFIG.nilai.bobot,
  };
  let terbobot = 0;
  let totalBobot = 0;
  for (const c of components) {
    terbobot += bobot[c.field] * c.unitScore;
    totalBobot += bobot[c.field];
  }
  const score = totalBobot > 0 ? terbobot / totalBobot : 0;

  return { status, components, discrepancies: failed, score };
}
