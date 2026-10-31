import { ImageResponse } from "next/og";
import { getProyekViewData } from "@/components/teralur/proyek-view-data";
import { databaseConfigured } from "@/lib/server-api";

// Gambar bagikan (Lampiran H.4, T-25): ImageResponse 1200×630, tipe image/png.
// Isi: pita SIMULASI di atas (bila demo), nama paket maksimal 90 karakter lalu
// "…", chip status dengan teksnya, satu baris cincin bila dapat dihitung,
// wordmark teralur di kanan bawah. Untuk slug yang tidak tersedia, kembalikan
// gambar generik teralur (bukan galat). Bila font khusus gagal, jatuh ke font
// sans bawaan (di sini langsung memakai sans bawaan).
// Gaya bersih: kertas #FCFCFA, tinta #1B1917, ubin logo gradasi brand
// #FFD650 → #F5BC00 (mengikuti TeralurLogo.svg).

export const alt = "Kartu bukti Teralur untuk proyek publik";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATUS_LABELS: Record<string, string> = {
  cocok: "Cocok dengan catatan resmi",
  selisih: "Selisih data, perlu klarifikasi",
  tidak_ditemukan: "Tidak ditemukan di data yang kami miliki",
  catatan_resmi: "Catatan resmi",
};

// Warna chip status mengikuti token status situs.
const WARNA_STATUS: Record<string, string> = {
  cocok: "#1F8A5B",
  selisih: "#D9480F",
};
const NETRAL = "#6B6F76";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let title = "Transparansi Proyek Publik";
  let status = "Informasi belum tersedia";
  let statusKey = "";
  let demo = false;
  let barisCincin: string | null = null;

  if (databaseConfigured()) {
    try {
      const data = await getProyekViewData(slug);
      if (data) {
        title = data.packageName;
        statusKey = data.status;
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

  const warnaChip = WARNA_STATUS[statusKey] ?? NETRAL;

  // Runtime ImageResponse, ukuran, dan pendekatan font (sans bawaan, tanpa
  // fetch) tidak berubah — hanya gaya visualnya.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#FCFCFA",
          color: "#1B1917",
          fontFamily: "sans-serif",
        }}
      >
        {demo ? (
          <div
            style={{
              display: "flex",
              padding: "18px 64px",
              background: "#14110F",
              color: "#FFC400",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            TERALUR · TRANSPARANSI PROYEK PUBLIK
          </div>
        ) : (
          <div style={{ display: "flex", height: 10, background: "linear-gradient(90deg, #FFD650, #F5BC00)" }} />
        )}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "44px 64px 52px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(27, 25, 23, 0.12)",
              paddingBottom: 22,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Ubin logo gradasi brand dengan "t" tebal. */}
              <div
                style={{
                  display: "flex",
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(180deg, #FFD650, #F5BC00)",
                  borderRadius: 16,
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#FFFFFF",
                }}
              >
                t
              </div>
              <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>teralur</div>
            </div>
            <div style={{ display: "flex", fontSize: 19, letterSpacing: 4, color: "rgba(27, 25, 23, 0.55)" }}>
              TRANSPARANSI PROYEK PUBLIK
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 54,
              lineHeight: 1.12,
              fontWeight: 800,
              letterSpacing: -1,
              maxHeight: 250,
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 18,
              borderTop: "1px solid rgba(27, 25, 23, 0.12)",
              paddingTop: 24,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignSelf: "flex-start", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  background: warnaChip,
                  color: "#FFFFFF",
                  padding: "12px 22px",
                  borderRadius: 999,
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {status}
              </div>
              {barisCincin ? (
                <div style={{ display: "flex", fontSize: 26, color: "#1B1917", fontWeight: 600 }}>
                  {barisCincin}
                </div>
              ) : null}
            </div>
            {/* Wordmark kanan bawah (H.4). */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  width: 34,
                  height: 34,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(180deg, #FFD650, #F5BC00)",
                  borderRadius: 12,
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#FFFFFF",
                }}
              >
                t
              </div>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>teralur</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
