import { ImageResponse } from "next/og";
import { getProyekViewData } from "@/components/teralur/proyek-view-data";
import { databaseConfigured } from "@/lib/server-api";

// Gambar bagikan (Lampiran H.4, T-25): ImageResponse 1200×630, tipe image/png.
// Isi: pita SIMULASI di atas (bila demo), nama paket maksimal 90 karakter lalu
// "…", chip status dengan teksnya, satu baris cincin bila dapat dihitung,
// wordmark teralur di kanan bawah. Untuk slug yang tidak tersedia, kembalikan
// gambar generik teralur (bukan galat). Bila font khusus gagal, jatuh ke font
// sans bawaan (di sini langsung memakai sans bawaan).

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
  let demo = false;
  let barisCincin: string | null = null;

  if (databaseConfigured()) {
    try {
      const data = await getProyekViewData(slug);
      if (data) {
        title = data.packageName;
        status = STATUS_LABELS[data.status] ?? status;
        demo = data.demo;
        const ring = data.timeRing;
        if (ring.state === "running" || ring.state === "not_started") {
          barisCincin = ring.caption;
        } else if (ring.state === "over" && ring.overDays !== null) {
          barisCincin = `Melewati masa kontrak tercatat ${ring.overDays} hari`;
        }
      }
    } catch {
      // Slug tidak tersedia / data rusak: gambar generik, bukan galat (H.4).
    }
  }

  // Nama paket maksimal 90 karakter lalu "…" (H.4).
  if (title.length > 90) title = `${title.slice(0, 89)}…`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: "#F5F5F5",
          color: "#14110F",
          borderTop: demo ? "none" : "24px solid #FFC400",
          fontFamily: "sans-serif",
        }}
      >
        {demo ? (
          <div
            style={{
              display: "flex",
              margin: "-56px -64px 0",
              padding: "18px 64px",
              background: "#14110F",
              color: "#FFC400",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            SIMULASI, BUKAN DATA RESMI
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>teralur</div>
          <div style={{ marginTop: 10, fontSize: 25, color: "#555" }}>
            TRANSPARANSI PROYEK PUBLIK
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 54,
              lineHeight: 1.12,
              fontWeight: 800,
              maxHeight: 250,
              overflow: "hidden",
            }}
          >
            {title}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignSelf: "flex-start", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "#FFC400",
                border: "2px solid #14110F",
                padding: "12px 20px",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {status}
            </div>
            {barisCincin ? (
              <div style={{ display: "flex", fontSize: 26, color: "#14110F", fontWeight: 600 }}>
                {barisCincin}
              </div>
            ) : null}
          </div>
          {/* Wordmark kanan bawah (H.4). */}
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800 }}>teralur</div>
        </div>
      </div>
    ),
    size,
  );
}
