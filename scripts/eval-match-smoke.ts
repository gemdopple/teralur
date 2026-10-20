// T-10 (pemilik PM): uji pencocokan pada sampel data nyata — pengganti sementara gold set
// (foto papan belum ada, dilompati atas keputusan tim). Ambil sampel records dari Supabase,
// bangun papan dari catatan itu sendiri (simulasi papan yang benar) dan papan yang diubah
// (kata terakhir dibuang / nilai beda) untuk melihat perilaku status. Hasil: tabel ringkas.
// Pakai: npm run eval:match-smoke

import { createClient } from "@supabase/supabase-js";
import { match } from "../src/lib/match/match";
import type { Papan, RecordResmi } from "../src/lib/match/types";

type BarisRecords = {
  id: string;
  nama_paket: string;
  penyedia: string | null;
  nilai_kontrak: number;
  tanggal_kontrak: string | null;
  masa_hari: number | null;
  tahun: number | null;
};

function jadiPapan(r: BarisRecords, ubah: "asli" | "tanpa_kata_akhir" | "nilai_selisih"): Papan {
  let nama = r.nama_paket;
  if (ubah === "tanpa_kata_akhir") {
    const kata = nama.split(/\s+/);
    if (kata.length > 1) kata.pop();
    nama = kata.join(" ");
  }
  const nilai =
    ubah === "nilai_selisih" ? Math.round(r.nilai_kontrak * 1.15) : r.nilai_kontrak;
  return {
    nama_paket: nama,
    penyedia: r.penyedia,
    nilai_kontrak: nilai,
    masa_hari: r.masa_hari,
    tahun_anggaran: r.tahun,
    sumber_dana: null,
    satuan_kerja: null,
    nomor_kontrak: null,
    tanggal_kontrak: r.tanggal_kontrak,
    lokasi_teks: null,
  };
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !kunci) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ada");

  const supabase = createClient(url, kunci, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("records")
    .select(
      "id, nama_paket, penyedia, nilai_kontrak, tanggal_kontrak, masa_hari, tahun",
    )
    .limit(100);
  if (error) throw new Error(`ambil records: ${error.message}`);
  const records = (data ?? []) as BarisRecords[];
  if (records.length === 0) throw new Error("Tidak ada records di basis data.");

  // Kumpulan kandidat: seluruh sampel, seperti pool hasil RPC nanti.
  const pool: RecordResmi[] = records.map((r) => ({
    id: r.id,
    nama_paket: r.nama_paket,
    penyedia: r.penyedia,
    nilai_kontrak: Number(r.nilai_kontrak),
    tanggal_kontrak: r.tanggal_kontrak,
    masa_hari: r.masa_hari,
    tahun: r.tahun,
  }));

  const skenario = [
    ["papan asli (harus Cocok)", "asli"],
    ["nama dikurangi kata terakhir", "tanpa_kata_akhir"],
    ["nilai 15% lebih tinggi", "nilai_selisih"],
  ] as const;

  for (const [label, mode] of skenario) {
    const hitung = { cocok: 0, selisih: 0, tidak_ditemukan: 0, benar: 0 };
    for (const r of records) {
      const hasil = match(jadiPapan(r, mode), pool);
      hitung[hasil.status]++;
      if (hasil.terbaik?.id === r.id) hitung.benar++;
    }
    const total = records.length;
    console.log(
      `${label}: n=${total} → cocok=${hitung.cocok}, selisih=${hitung.selisih}, ` +
        `tidak_ditemukan=${hitung.tidak_ditemukan}, kandidat terbaik tepat sasaran=` +
        `${hitung.benar} (${((hitung.benar / total) * 100).toFixed(1)}%)`,
    );
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
