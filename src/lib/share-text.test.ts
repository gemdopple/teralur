import { describe, expect, it } from "vitest";
import { teksSiapBagikan, type TeksBagikanInput } from "./share-text";

// Teks siap-bagikan WhatsApp (§3 P1). Vektor memeriksa isi wajib (catatan
// cincin G.1, pernyataan batas) dan bebas kata terlarang 6.7.

const DASAR: TeksBagikanInput = {
  packageName: "Rehabilitasi Jalan Lingkungan Melati Raya Kecamatan Sukamaju",
  statusLabel: "Cocok dengan catatan resmi",
  ringCaption: "Hari ke-74 dari 90",
  ringNote: "Ini waktu yang telah berjalan, bukan kemajuan fisik",
  demo: true,
  snapshotDate: null,
  url: "https://teralur.example/dossiers/k7m2p9qx4tvb",
};

const KATA_TERLARANG =
  /\b(korupsi|markup|fiktif|curang|penipuan|bermasalah|gelap|terlambat|molor|mangkrak|hilang|disembunyikan|tidak ada)\b/i;

describe("teksSiapBagikan", () => {
  it("memuat nama, status, cincin beserta catatannya, batas, dan URL", () => {
    const teks = teksSiapBagikan(DASAR);
    expect(teks).toContain(DASAR.packageName);
    expect(teks).toContain("Status: Cocok dengan catatan resmi.");
    expect(teks).toContain(
      "Waktu: Hari ke-74 dari 90. Ini waktu yang telah berjalan, bukan kemajuan fisik.",
    );
    expect(teks).toContain(
      "Perbedaan tidak berarti kesalahan. Hubungi kami untuk koreksi atau klarifikasi.",
    );
    expect(teks).toContain(DASAR.url);
    expect(teks).toContain("teralur · Transparansi Proyek Publik");
  });

  it("proyek non-demo memakai pita data snapshot", () => {
    const teks = teksSiapBagikan({ ...DASAR, demo: false, snapshotDate: "2026-10-24" });
    expect(teks).toContain("Data resmi per 24 Oktober 2026. Bukan data real-time.");
    expect(teks).not.toContain("SIMULASI");
  });

  it("ringNote null (cincin unknown) menulis caption tanpa catatan tambahan", () => {
    const teks = teksSiapBagikan({
      ...DASAR,
      ringCaption: "Tanggal mulai tidak tersedia",
      ringNote: null,
    });
    expect(teks).toContain("Waktu: Tanggal mulai tidak tersedia.");
    expect(teks).not.toContain("kemajuan fisik.");
  });

  it("bebas kata terlarang 6.7 pada semua varian", () => {
    const varian = [
      DASAR,
      { ...DASAR, demo: false, snapshotDate: "2026-10-24" },
      { ...DASAR, ringCaption: "Masa pelaksanaan tidak tersedia", ringNote: null },
      {
        ...DASAR,
        statusLabel: "Selisih data, perlu klarifikasi",
        ringCaption: "Melewati masa kontrak tercatat 60 hari. Addendum atau perpanjangan mungkin ada.",
      },
    ];
    for (const input of varian) {
      expect(teksSiapBagikan(input)).not.toMatch(KATA_TERLARANG);
    }
  });
});
