import { ImageResponse } from "next/og";
import { getDossier, databaseConfigured } from "@/lib/server-api";

export const alt = "Kartu bukti Teralur untuk proyek publik";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATUS_LABELS: Record<string, string> = {
  cocok: "Cocok dengan catatan resmi",
  selisih: "Selisih data, perlu klarifikasi",
  tidak_ditemukan: "Tidak ditemukan di data yang kami miliki",
  catatan_resmi: "Catatan resmi",
};

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let title = "Transparansi Proyek Publik";
  let status = "Informasi belum tersedia";
  if (databaseConfigured()) {
    const dossier = await getDossier(slug);
    if (dossier) {
      title =
        dossier.record?.nama_paket ??
        (typeof dossier.submission.papan?.nama_paket === "string"
          ? dossier.submission.papan.nama_paket
          : title);
      status = STATUS_LABELS[dossier.submission.status ?? ""] ?? status;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "#F5F5F5",
          color: "#14110F",
          borderTop: "24px solid #FFC400",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 34, fontWeight: 800 }}>teralur</div>
          <div style={{ marginTop: 34, fontSize: 25, color: "#555" }}>TRANSPARANSI PROYEK PUBLIK</div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 54,
              lineHeight: 1.12,
              fontWeight: 800,
              maxHeight: 240,
              overflow: "hidden",
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: "#FFC400",
              border: "2px solid #14110F",
              padding: "14px 22px",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {status}
          </div>
          <div style={{ marginTop: 20, fontSize: 21, color: "#555" }}>
            Data publik bertanggal. Perbedaan tidak berarti kesalahan.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
