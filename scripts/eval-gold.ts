// Gold-set evaluation (stub): reads data/gold.csv and prints a table of its rows.
// TODO: run match() on each row's extracted fields against the records table and
// compare with the expected status; report precision/recall per field.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Minimal RFC-4180-ish CSV parser: handles quoted fields and escaped double quotes.
function parseCsv(teks: string): string[][] {
  const barisSemua: string[][] = [];
  let kolom = "";
  let dalamKutip = false;
  let barisKini: string[] = [];
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (dalamKutip) {
      if (c === '"' && teks[i + 1] === '"') {
        kolom += '"';
        i++;
      } else if (c === '"') {
        dalamKutip = false;
      } else {
        kolom += c;
      }
    } else if (c === '"') {
      dalamKutip = true;
    } else if (c === ",") {
      barisKini.push(kolom);
      kolom = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && teks[i + 1] === "\n") i++;
      barisKini.push(kolom);
      kolom = "";
      barisSemua.push(barisKini);
      barisKini = [];
    } else {
      kolom += c;
    }
  }
  if (kolom !== "" || barisKini.length > 0) {
    barisKini.push(kolom);
    barisSemua.push(barisKini);
  }
  return barisSemua.filter((b) => b.length > 1 || b[0] !== "");
}

function main(): void {
  const file = path.join(process.cwd(), "data", "gold.csv");
  if (!existsSync(file)) {
    console.error(`data/gold.csv tidak ditemukan di ${file}`);
    process.exit(1);
  }
  const [header, ...baris] = parseCsv(readFileSync(file, "utf8"));
  const data = baris.map((b) => Object.fromEntries(header.map((h, i) => [h, b[i] ?? ""])));
  console.table(
    data.map((d) => ({
      id: d.id,
      nama_paket: d.nama_paket,
      penyedia: d.penyedia,
      nilai_kontrak: d.nilai_kontrak,
      tahun: d.tahun,
    })),
  );
  console.log(`Total baris gold: ${data.length}`);
}

main();
