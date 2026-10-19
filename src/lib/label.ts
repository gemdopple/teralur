import type { Label } from "./match/types";

export type { Label } from "./match/types";

// The kinds of data that can appear in the evidence dossier.
export type JenisData =
  | "catatan_resmi"
  | "papan_terkonfirmasi"
  | "hari_berjalan"
  | "selisih_nilai"
  | "persen_progres"
  | "alasan_selisih";

const PETA_LABEL: Record<JenisData, Label> = {
  catatan_resmi: "tercatat",
  papan_terkonfirmasi: "tercatat",
  hari_berjalan: "hitungan",
  selisih_nilai: "hitungan",
  // Persen progres is ALWAYS belum_diketahui: it is never trusted from any source.
  persen_progres: "belum_diketahui",
  alasan_selisih: "belum_diketahui",
};

export function labelUntuk(jenis: string): Label {
  if (jenis === "persen_progres") return "belum_diketahui";
  return PETA_LABEL[jenis as JenisData] ?? "belum_diketahui";
}
