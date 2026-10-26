// Teks siap-bagikan untuk WhatsApp (PRD §3 P1: "Salin teks siap-bagikan untuk
// WhatsApp"). Fungsi murni tanpa I/O: URL absolut dimasukkan sebagai argumen
// oleh pemanggil (komponen klien membangunnya dari location.origin saat tombol
// ditekan). Teks mengikuti kamus kata 6.7 dan membawa catatan cincin G.1.

import { formatTanggal } from "./dates";

export type TeksBagikanInput = {
  packageName: string;
  /** Teks chip status, mis. "Cocok dengan catatan resmi". */
  statusLabel: string;
  /** Caption cincin G.1, mis. "Hari ke-74 dari 90" atau "Tanggal mulai tidak tersedia". */
  ringCaption: string;
  /** RING_NOTE bila cincin terhitung; null bila keadaan unknown. */
  ringNote: string | null;
  demo: boolean;
  /** TTTT-BB-HH; dipakai hanya untuk proyek non-demo. */
  snapshotDate: string | null;
  /** URL absolut dossier. */
  url: string;
};

export function teksSiapBagikan(input: TeksBagikanInput): string {
  const baris: string[] = [
    input.packageName,
    `Status: ${input.statusLabel}.`,
    input.ringNote
      ? `Waktu: ${input.ringCaption}. ${input.ringNote}.`
      : `Waktu: ${input.ringCaption}.`,
  ];
  if (!input.demo && input.snapshotDate) {
    baris.push(`Data resmi per ${formatTanggal(input.snapshotDate)}. Bukan data real-time.`);
  }
  baris.push(
    "Perbedaan tidak berarti kesalahan. Hubungi kami untuk koreksi atau klarifikasi.",
    `Rincian dan jejak sumber: ${input.url}`,
    "teralur · Transparansi Proyek Publik",
  );
  return baris.join("\n");
}
