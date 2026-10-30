import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";

// Kode QR dossier (T-46, Lampiran K.1). URL tanpa parameter supaya QR lebih
// jarang kepadatan dan mudah dipindai; gelap #14110F di atas putih; margin
// (zona hening) 4 modul; tanpa logo di tengah. Server-side only.

// Basis URL publik: NEXT_PUBLIC_SITE_URL bila diatur; bila kosong, turunkan
// dari host permintaan agar QR tetap terbentuk di pratinjau lokal (sama
// dengan halaman papan). Melempar hanya bila keduanya tak tersedia.
export async function basisSitus(): Promise<string> {
  const teratur = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (teratur) return teratur;
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) throw new Error("NEXT_PUBLIC_SITE_URL belum diisi");
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}

export async function dossierUrl(slug: string): Promise<string> {
  return `${await basisSitus()}/dossiers/${slug}`;
}

export async function qrSvg(slug: string): Promise<string> {
  return QRCode.toString(await dossierUrl(slug), {
    type: "svg",
    errorCorrectionLevel: "Q",
    margin: 4,
    color: { dark: "#14110F", light: "#FFFFFF" },
  });
}

export async function qrPng(slug: string): Promise<Buffer> {
  return QRCode.toBuffer(await dossierUrl(slug), {
    type: "png",
    errorCorrectionLevel: "Q",
    margin: 4,
    width: 1024,
    color: { dark: "#14110F", light: "#FFFFFF" },
  });
}

// QR dari URL penuh — dipakai papan proyek dasbor yang menunjuk dossier atau
// halaman example publik, bukan hanya /dossiers/<slug>.
export async function qrSvgDari(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "Q",
    margin: 2,
    color: { dark: "#14110F", light: "#FFFFFF" },
  });
}
