// T-08 (pemilik BE): impor data/raw/main_tangerang.csv + awards_tangerang.csv ke tabel
// `records`. Aturan pembersihan PRD 7.2: tanggal di luar 2015..(sekarang+5 tahun) jadi
// null; baris tanpa nilai kontrak atau tanpa nama paket dibuang (dihitung); duplikat
// id_sumber dibuang. Upsert pada (sumber, id_sumber) sehingga skrip bisa diulang.
// Catatan data: flattening awards ini tidak memuat nama penyedia, jadi penyedia null.
// Pakai: npm run import:records

import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { normalisasiTeks } from "../src/lib/match/normalisasi";

const RAW = path.resolve("data/raw");
const MAIN = path.join(RAW, "main_tangerang.csv");
const AWARDS = path.join(RAW, "awards_tangerang.csv");
const SUMBER = "opentender";
const SNAPSHOT_TANGGAL = "2026-10-20";
const UKURAN_BATCH = 500;

// Tanggal kontrak di luar rentang ini jadi null (PRD 7.2).
const BATAS_BAWAH_TAHUN = 2015;
const BATAS_ATAS_TAHUN = new Date().getFullYear() + 5;

function parseBaris(baris: string): string[] {
  const kolom: string[] = [];
  let kini = "";
  let dalamKutip = false;
  for (let i = 0; i < baris.length; i++) {
    const c = baris[i];
    if (dalamKutip) {
      if (c === '"' && baris[i + 1] === '"') { kini += '"'; i++; }
      else if (c === '"') dalamKutip = false;
      else kini += c;
    } else if (c === '"') dalamKutip = true;
    else if (c === ",") { kolom.push(kini); kini = ""; }
    else kini += c;
  }
  kolom.push(kini);
  return kolom;
}

type Kontrak = { tanggal: string | null; nilai: number | null };

async function bacaAwards(): Promise<Map<string, Kontrak>> {
  const rl = createInterface({ input: createReadStream(AWARDS) });
  const peta = new Map<string, Kontrak>();
  let pertama = true;
  for await (const l of rl) {
    const k = parseBaris(l);
    if (pertama) {
      pertama = false;
      continue;
    }
    if (k.length < 5) continue;
    const ocid = k[5];
    const tanggal = k[1].slice(0, 10);
    const nilai = Number(k[3]);
    const ada = peta.get(ocid);
    // Award terakhir (tanggal terbesar) sebagai kontrak efektif, konsisten dengan coverage.ts.
    if (!ada || tanggal > (ada.tanggal ?? "")) {
      peta.set(ocid, {
        tanggal: tanggal === "" ? null : tanggal,
        nilai: Number.isFinite(nilai) && nilai > 0 ? Math.round(nilai) : null,
      });
    }
  }
  return peta;
}

function tanggalValid(iso: string | null): string | null {
  if (!iso) return null;
  const tahun = Number(iso.slice(0, 4));
  if (!Number.isFinite(tahun) || tahun < BATAS_BAWAH_TAHUN || tahun > BATAS_ATAS_TAHUN) {
    return null;
  }
  return iso;
}

function wilayahDari(buyer: string): string {
  if (buyer.includes("Kabupaten")) return "Kabupaten Tangerang";
  if (buyer.includes("Kota")) return "Kota Tangerang";
  return buyer;
}

type BarisRecords = {
  sumber: string;
  id_sumber: string;
  nama_paket: string;
  nama_norm: string;
  satuan_kerja: string | null;
  penyedia: string | null;
  penyedia_norm: string | null;
  nilai_kontrak: number;
  tanggal_kontrak: string | null;
  masa_hari: number | null;
  tahun: number | null;
  wilayah: string;
  metode: string | null;
  mentah: Record<string, unknown>;
  snapshot_tanggal: string;
};

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !kunci) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ada di .env");
  }
  const supabase = createClient(url, kunci, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const awards = await bacaAwards();
  const rl = createInterface({ input: createReadStream(MAIN) });

  const terimport = new Map<string, BarisRecords>();
  let works = 0;
  let tanpaNamaPaket = 0;
  let tanpaNilai = 0;
  let duplikat = 0;
  let tanggalDibuang = 0;
  let pertama = true;

  for await (const l of rl) {
    if (pertama) {
      pertama = false;
      continue;
    }
    const k = parseBaris(l);
    if (k.length < 11) continue;
    if (k[9] !== "works") continue;
    works++;

    const ocid = k[3];
    const namaPaket = k[10].trim();
    if (namaPaket === "") {
      tanpaNamaPaket++;
      continue;
    }
    const kontrak = awards.get(ocid);
    const nilai = kontrak?.nilai ?? null;
    if (nilai === null) {
      tanpaNilai++;
      continue;
    }
    if (terimport.has(ocid)) {
      duplikat++;
      continue;
    }

    const tanggal = tanggalValid(kontrak?.tanggal ?? null);
    if (kontrak?.tanggal && tanggal === null) tanggalDibuang++;

    terimport.set(ocid, {
      sumber: SUMBER,
      id_sumber: ocid,
      nama_paket: namaPaket,
      nama_norm: normalisasiTeks(namaPaket),
      satuan_kerja: k[19] !== "" ? k[19] : k[7] || null,
      penyedia: null,
      penyedia_norm: null,
      nilai_kontrak: nilai,
      tanggal_kontrak: tanggal,
      masa_hari: null,
      tahun: Number(k[2].slice(0, 4)) || null,
      wilayah: wilayahDari(k[7]),
      metode: null,
      mentah: { ocid, buyer_name: k[7], kategori: k[9], tender_status: k[12] },
      snapshot_tanggal: SNAPSHOT_TANGGAL,
    });
  }

  const baris = [...terimport.values()];
  console.log(
    `works=${works}, impor=${baris.length}, tanpaNamaPaket=${tanpaNamaPaket}, ` +
      `tanpaNilai=${tanpaNilai}, duplikat=${duplikat}, tanggalDiluarRentang=${tanggalDibuang}`,
  );

  for (let i = 0; i < baris.length; i += UKURAN_BATCH) {
    const batch = baris.slice(i, i + UKURAN_BATCH);
    const { error } = await supabase
      .from("records")
      .upsert(batch, { onConflict: "sumber,id_sumber" });
    if (error) throw new Error(`upsert batch ${i}: ${error.message}`);
  }
  console.log(`Upsert selesai (${baris.length} baris).`);

  const { count, error: errHitung } = await supabase
    .from("records")
    .select("*", { count: "exact", head: true });
  if (errHitung) throw new Error(`count: ${errHitung.message}`);
  console.log(`count(*) records = ${count}`);
  if (count !== baris.length) {
    throw new Error(
      `count(*) ${count} tidak sama dengan baris terkirim ${baris.length} — periksa sebelum menutup T-08`,
    );
  }
  console.log("T-08 selesai: count(*) sama dengan jumlah baris impor.");
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
