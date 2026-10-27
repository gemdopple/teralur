// Flag jalur foto beku (PRD v1.1, Lampiran B.3). Default NYALA — jalur foto
// adalah alur pelaporan warga: /check tampil di navigasi, /api/match dan
// PATCH /api/dossiers/[slug] aktif. Isi PHOTO_FLOW_ENABLED=false untuk
// membekukan semuanya (404) tanpa mengubah kode.
export function photoFlowEnabled(): boolean {
  return process.env.PHOTO_FLOW_ENABLED !== "false";
}
