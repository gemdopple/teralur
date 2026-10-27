import { KESULITAN_POW, bitNolHex } from "./pow";

// Pemecah bukti kerja di sisi peramban: cari nonce hex sehingga
// SHA-256(`<tantangan>:<nonce>`) punya bit nol secukupnya. Hash dikejalkan
// berkelompok (Promise.all) agar crypto.subtle tidak dibayar serial.

export async function selesaikanPoW(
  tantangan: string,
  kesulitan: number = KESULITAN_POW,
): Promise<string> {
  const encoder = new TextEncoder();
  const UKURAN_KELOMPOK = 64;
  const keHex = (buffer: ArrayBuffer) =>
    [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

  for (let dasar = 0; dasar < 1_000_000_000; dasar += UKURAN_KELOMPOK) {
    const kelompok: Promise<ArrayBuffer>[] = [];
    for (let i = 0; i < UKURAN_KELOMPOK; i++) {
      kelompok.push(
        crypto.subtle.digest("SHA-256", encoder.encode(`${tantangan}:${(dasar + i).toString(16)}`)),
      );
    }
    const hash = await Promise.all(kelompok);
    for (let i = 0; i < hash.length; i++) {
      if (bitNolHex(keHex(hash[i])) >= kesulitan) {
        return (dasar + i).toString(16);
      }
    }
  }
  throw new Error("Bukti kerja tidak terpecahkan.");
}
