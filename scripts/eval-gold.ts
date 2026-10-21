// T-10 (pemilik PM): evaluasi pencocokan pada gold set (PRD §11.1).
// Membaca data/gold.csv, menjalankan match() untuk setiap baris terhadap kandidat
// yang diambil lewat RPC yang sama dengan API (find_record_candidates), lalu
// mencetak tabel hasil per papan dan ringkasan (persentase papan yang menemukan
// catatan, presisi kandidat teratas, ketersediaan per field).
// Pakai: npm run eval:gold
// Bila gold.csv belum terisi (lapangan ditunda), cetak pesan dan keluar 0.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { match } from "../src/lib/match/match";
import { normalisasiTeks } from "../src/lib/match/normalisasi";
import type { RecordResmi } from "../src/lib/match/types";

type BarisGold = {
  id: string;
  berkas_foto: string;
  nama_paket: string;
  penyedia: string;
  nilai_kontrak: string;
  masa_hari: string;
  tahun: string;
  satuan_kerja: string;
  lokasi: string;
  id_catatan_resmi: string;
  catatan: string;
};

type HasilBaris = {
  id: string;
  statusDiharapkan: string;
  statusDapat: string;
  kandidatTerbaik: string;
  catatanDitemukan: string;
};

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

function angka(nilai: string): number | null {
  const bersih = nilai.trim().replace(/rp/gi, "").replace(/[.,\s]/g, "");
  if (bersih === "") return null;
  const n = Number(bersih);
  return Number.isFinite(n) ? n : null;
}

// Kolom catatan bebas; status ekspektasi hanya bisa dinyatakan lewat keberadaan
// id_catatan_resmi (dicatat manual bila papan ditemukan di catatan resmi).
function statusDiharapkan(baris: BarisGold): string {
  return baris.id_catatan_resmi.trim() !== "" ? "cocok/selisih" : "tidak_ditemukan";
}

async function main(): Promise<void> {
  const file = path.join(process.cwd(), "data", "gold.csv");
  if (!existsSync(file)) {
    console.error(`data/gold.csv tidak ditemukan di ${file}`);
    process.exit(1);
  }
  const [header, ...baris] = parseCsv(readFileSync(file, "utf8"));
  const data = baris
    .map((b) => Object.fromEntries(header.map((h, i) => [h, b[i] ?? ""])))
    .filter((d: Record<string, string>) => d.nama_paket?.trim() !== "" || d.penyedia?.trim() !== "");

  if (data.length === 0) {
    console.log(
      "Gold set belum terisi (foto papan lapangan ditunda tim). " +
        "Hasil interim: lihat `npm run eval:match-smoke` dan docs/t10-results.md. " +
        "Isi data/gold.csv sesuai PRD §11.1 lalu jalankan ulang.",
    );
    return; // exit 0, jangan mengarang baris
  }

  const url = process.env.SUPABASE_URL;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !kunci) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ada");
  const supabase = createClient(url, kunci, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const hasil: HasilBaris[] = [];
  const ketersediaan: Record<keyof Omit<BarisGold, "berkas_foto" | "catatan">, number> = {
    id: 0,
    nama_paket: 0,
    penyedia: 0,
    nilai_kontrak: 0,
    masa_hari: 0,
    tahun: 0,
    satuan_kerja: 0,
    lokasi: 0,
    id_catatan_resmi: 0,
  };
  let menemukan = 0;
  let presisiBenar = 0;

  for (const d of data as unknown as BarisGold[]) {
    for (const f of Object.keys(ketersediaan) as (keyof typeof ketersediaan)[]) {
      if (d[f]?.trim() !== "") ketersediaan[f]++;
    }
    const nilai = angka(d.nilai_kontrak);
    const papan = {
      nama_paket: d.nama_paket.trim() || null,
      penyedia: d.penyedia.trim() || null,
      nilai_kontrak: nilai,
      masa_hari: angka(d.masa_hari),
      tahun_anggaran: angka(d.tahun),
      sumber_dana: null,
      satuan_kerja: d.satuan_kerja.trim() || null,
      nomor_kontrak: null,
      tanggal_kontrak: null,
      lokasi_teks: d.lokasi.trim() || null,
    };
    const terisiKunci = [
      papan.nama_paket,
      papan.penyedia,
      papan.nilai_kontrak,
    ].filter((v) => v !== null && v !== "").length;
    if (terisiKunci < 2) {
      hasil.push({
        id: d.id,
        statusDiharapkan: statusDiharapkan(d),
        statusDapat: "field kunci kurang",
        kandidatTerbaik: "-",
        catatanDitemukan: "-",
      });
      continue;
    }

    const { data: kandidat, error } = await supabase.rpc("find_record_candidates", {
      package_name: normalisasiTeks(papan.nama_paket ?? ""),
      supplier_name: normalisasiTeks(papan.penyedia ?? ""),
      year_filter: papan.tahun_anggaran,
    });
    if (error) throw new Error(`RPC find_record_candidates gagal: ${error.message}`);
    const records: RecordResmi[] = (kandidat ?? []).map((r) => ({
      id: r.id,
      nama_paket: r.nama_paket,
      penyedia: r.penyedia,
      nilai_kontrak: Number(r.nilai_kontrak),
      tanggal_kontrak: r.tanggal_kontrak,
      masa_hari: r.masa_hari,
      tahun: r.tahun,
    }));

    const hasilMatch = match(papan, records);
    const ketemu = hasilMatch.status === "cocok" || hasilMatch.status === "selisih";
    if (ketemu) menemukan++;
    const catatanId = d.id_catatan_resmi.trim();
    const cocokResmi =
      catatanId !== "" &&
      hasilMatch.terbaik !== null &&
      hasilMatch.terbaik.id === catatanId;
    if (cocokResmi) presisiBenar++;
    const terbaik = hasilMatch.terbaik
      ? `${hasilMatch.terbaik.nama_paket.slice(0, 40)} (skor ${hasilMatch.skor.toFixed(2)})`
      : "-";
    const catatanDitemukan =
      catatanId === ""
        ? "tidak dicatat"
        : cocokResmi
          ? "ditemukan (id sama)"
          : ketemu
            ? "tidak sama dengan id catatan"
            : "tidak ditemukan";
    hasil.push({
      id: d.id,
      statusDiharapkan: statusDiharapkan(d),
      statusDapat: hasilMatch.status,
      kandidatTerbaik: terbaik,
      catatanDitemukan: catatanDitemukan,
    });
  }

  console.table(hasil);
  const total = data.length;
  console.log(`Total papan gold: ${total}`);
  console.log(
    `Papan menemukan catatan (Cocok/Selisih): ${menemukan}/${total} ` +
      `(${((menemukan / total) * 100).toFixed(1)}%) — gerbang G-02: ≥ 4 dari 12`,
  );
  const dicatat = (data as unknown as BarisGold[]).filter(
    (d) => d.id_catatan_resmi.trim() !== "",
  ).length;
  console.log(
    `Presisi kandidat teratas (id_catatan_resmi cocok): ` +
      `${dicatat > 0 ? `${presisiBenar}/${dicatat} (${((presisiBenar / dicatat) * 100).toFixed(1)}%)` : "belum dapat dinilai (tidak ada id catatan dicatat manual)"}`,
  );
  console.log(
    `Ketersediaan field: ${Object.entries(ketersediaan)
      .map(([k, v]) => `${k}=${v}/${total}`)
      .join(", ")}`,
  );
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
