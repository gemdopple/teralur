// MATCH_CONFIG — tuning knobs for the matching engine (src/lib/match).
// ONLY THE PM EDITS THIS FILE. Everyone else reads it; never hardcode these values
// anywhere else in the codebase.
export const MATCH_CONFIG = {
  penyedia: { lulus: 0.85, bobot: 0.40 },
  nama:     { lulus: 0.60, bobot: 0.35 },
  nilai:    { toleransi: 0.01, nolPada: 0.20, bobot: 0.25 },
  kandidatMin: 0.50,
  kandidatMaks: 3,
  seriBeda: 0.05,
} as const;
