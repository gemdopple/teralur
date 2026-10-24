import "server-only";
import QRCode from "qrcode";

// Kode QR dossier (T-46, Lampiran K.1). URL tanpa parameter supaya QR lebih
// jarang kepadatan dan mudah dipindai; gelap #14110F di atas putih; margin
// (zona hening) 4 modul; tanpa logo di tengah. Server-side only.

export function dossierUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (!base) throw new Error("NEXT_PUBLIC_SITE_URL belum diisi");
  return `${base}/dossiers/${slug}`;
}

export async function qrSvg(slug: string): Promise<string> {
  return QRCode.toString(dossierUrl(slug), {
    type: "svg",
    errorCorrectionLevel: "Q",
    margin: 4,
    color: { dark: "#14110F", light: "#FFFFFF" },
  });
}

export async function qrPng(slug: string): Promise<Buffer> {
  return QRCode.toBuffer(dossierUrl(slug), {
    type: "png",
    errorCorrectionLevel: "Q",
    margin: 4,
    width: 1024,
    color: { dark: "#14110F", light: "#FFFFFF" },
  });
}
