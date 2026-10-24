// Flag jalur foto beku (PRD v1.1, Lampiran B.3). Default mati: alur foto v1.0
// tidak muncul di navigasi, /check memanggil notFound(), dan /api/match serta
// PATCH /api/dossiers/[slug] mengembalikan 404 selama flag tidak dinyalakan.
export function photoFlowEnabled(): boolean {
  return process.env.PHOTO_FLOW_ENABLED === "true";
}
