// Uji T-03 (PM): jalankan ekstraksi pada satu foto papan lewat CLI.
// Pakai: npx tsx scripts/test-vision.ts path/ke/foto.jpg
// Butuh env: MODEL_API_KEY (wajib), MODEL_NAME, MODEL_BASE_URL (opsional).
// Keluaran: JSON ekstraksi, latensi, dan biaya bila API menyediakan usage.

import { readFileSync } from "node:fs";
import { extractPapan } from "../src/lib/vision";

async function main(): Promise<void> {
  const foto = process.argv[2];
  if (!foto) {
    console.error("Pakai: npx tsx scripts/test-vision.ts <path/foto.jpg>");
    process.exit(1);
  }
  const image = readFileSync(foto);
  if (image.length > 4 * 1024 * 1024) {
    console.error(`Foto ${(image.length / 1048576).toFixed(1)} MB melebihi 4 MB — kecilkan dulu (F-01).`);
    process.exit(1);
  }

  const mulai = Date.now();
  try {
    const hasil = await extractPapan(image);
    const detik = ((Date.now() - mulai) / 1000).toFixed(1);
    console.log(`Latensi: ${detik}s (batas 20s)`);
    console.log(JSON.stringify(hasil, null, 2));
    console.log("\nCatat di T-03: model yang dipakai, latensi, dan biaya per foto.");
  } catch (galat) {
    console.error("Ekstraksi gagal:", galat instanceof Error ? galat.message : galat);
    console.error("Jalur fallback: formulir manual (PRD 7.4).");
    process.exit(1);
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
