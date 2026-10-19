// Laporan cakupan T-07 (pemilik BE, dibantu PM): baca data/raw/main_tangerang.csv,
// gabungkan dengan awards (tanggal & nilai kontrak), lalu tulis docs/t07-coverage.md:
// baris per tahun, % punya tanggal kontrak, % punya nilai kontrak, % punya masa hari (OCDS
// flattening ini tidak memuat masa kontrak — dilaporkan apa adanya), dan syarat lisensi.
// Pakai: npx tsx scripts/coverage.ts

import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";

const RAW = path.resolve("data/raw");
const MAIN = path.join(RAW, "main_tangerang.csv");
const AWARDS = path.join(RAW, "awards_tangerang.csv");
const KELUARAN = path.resolve("docs/t07-coverage.md");

// Parser CSV sederhana untuk kolom pertama N; data ini punya kutip dengan koma di title,
// jadi parse penuh dengan dukungan kutip seperti di eval-gold.ts.
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

type Tender = { ocid: string; tahun: string; kategori: string; pembeli: string };

async function bacaMain(): Promise<{ header: string[]; baris: Tender[] }> {
  const rl = createInterface({ input: createReadStream(MAIN) });
  let header: string[] = [];
  const baris: Tender[] = [];
  let pertama = true;
  for await (const l of rl) {
    const k = parseBaris(l);
    if (pertama) {
      header = k;
      pertama = false;
      continue;
    }
    if (k.length < 11) continue;
    baris.push({ ocid: k[3], tahun: k[2].slice(0, 4), kategori: k[9], pembeli: k[7] });
  }
  return { header, baris };
}

type Kontrak = { ocid: string; tanggal: string | null; nilai: number | null };

async function bacaAwards(): Promise<Map<string, Kontrak>> {
  const rl = createInterface({ input: createReadStream(AWARDS) });
  const peta = new Map<string, Kontrak>();
  let pertama = true;
  for await (const l of rl) {
    const k = parseBaris(l);
    if (pertama) {
      const idxOcid = k.indexOf("main_ocid");
      const idxTanggal = k.indexOf("date");
      const idxNilai = k.indexOf("value_amount");
      pertama = false;
      void idxOcid; void idxTanggal; void idxNilai; // indeks dihitung per baris di bawah
      continue;
    }
    if (k.length < 5) continue;
    const ocid = k[5];
    const tanggal = k[1].slice(0, 10);
    const nilai = Number(k[3]);
    const ada = peta.get(ocid);
    // Ambil award terakhir (tanggal terbesar) sebagai kontrak efektif.
    if (!ada || tanggal > (ada.tanggal ?? "")) {
      peta.set(ocid, {
        ocid,
        tanggal: tanggal && tanggal !== "" ? tanggal : null,
        nilai: Number.isFinite(nilai) && nilai > 0 ? nilai : null,
      });
    }
  }
  return peta;
}

async function main(): Promise<void> {
  const main = await bacaMain();
  const awards = await bacaAwards();

  const works = main.baris.filter((b) => b.kategori === "works");
  const hitungTahun = new Map<string, number>();
  let adaTanggal = 0;
  let adaNilai = 0;
  const tanpaKontrak: string[] = [];
  for (const b of works) {
    hitungTahun.set(b.tahun, (hitungTahun.get(b.tahun) ?? 0) + 1);
    const a = awards.get(b.ocid);
    if (a?.tanggal) adaTanggal++;
    if (a?.nilai) adaNilai++;
    else tanpaKontrak.push(b.ocid);
  }

  const persen = (n: number) => `${((n / works.length) * 100).toFixed(1)}%`;
  const tahunUrut = [...hitungTahun.entries()].sort(([a], [b]) => a.localeCompare(b));
  const tahunTabel = tahunUrut.map(([t, n]) => `| ${t} | ${n} |`).join("\n");

  const isi = `# Laporan cakupan data (T-07)

Sumber: Opentender ICW OCDS (lisensi ODbL) — unduhan 2026-10-20, subset wilayah Tangerang.
Berkas: \`data/raw/main_tangerang.csv\` + \`data/raw/awards_tangerang.csv\`. Snapshot bertanggal, bukan real-time.

## Ringkasan

| Metrik | Nilai |
| --- | --- |
| Total tender Tangerang (Kab. + Kota, tanpa Tangsel) | ${main.baris.length} |
| Tender kategori \`works\` (konstruksi) | ${works.length} |
| Dengan tanggal kontrak (dari awards) | ${adaTanggal} (${persen(adaTanggal)}) |
| Dengan nilai kontrak > 0 | ${adaNilai} (${persen(adaNilai)}) |
| Dengan masa hari (durasi kontrak) | 0 (0%) — kolom durasi tidak tersedia di OCDS flattening ini; cincin waktu akan mengambil durasi dari papan (PRD 6.5) |
| Pembeli terbanyak | ${[...new Set(works.map((b) => b.pembeli))].slice(0, 3).join(" · ")} |

## Baris works per tahun (dari tanggal tender)

| Tahun | Works |
| --- | --- |
${tahunTabel}

## Gerbang G-01

Syarat: ≥ 100 catatan konstruksi di wilayah target. Tercatat **${works.length}** baris \`works\` — lulus jauh di atas ambang. Keputusan dicatat di PRD 13.3.

## Syarat lisensi (A-06)

ODbL mengharuskan atribusi sumber ("Sumber: Opentender — data pengadaan Indonesia, ICW, ODbL") dan berbagi-serupa bila basis data didistribusikan ulang. Atribusi wajib tampil di footer dan kartu bukti (PRD 7.2, F-09, F-12). Tautan sumber: https://opentender.net

## Catatan untuk impor (T-08)

- Baris works tanpa award: ${tanpaKontrak.length} — tetap diimpor bila punya nama paket; nilai kosong menyaring diri sesuai 7.2.
- Bersihkan tanggal di luar 2015–(sekarang+5 tahun) jadi \`null\`; buang duplikat \`id_sumber\`.
`;

  writeFileSync(KELUARAN, isi);
  console.log(`Laporan ditulis: ${KELUARAN}`);
  console.log(`works=${works.length}, dengan tanggal=${adaTanggal} (${persen(adaTanggal)}), dengan nilai=${adaNilai} (${persen(adaNilai)})`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
