// Pipeline dokumen demo (1/3 — ambil data): dump proyek admin terbit ke
// scripts/dokumen-demo/proyek.json untuk digenerator PDF.
// Jalankan: npx tsx --env-file=.env scripts/dokumen-demo/ambil-data.mts
// Urutan lengkap: ambil-data.mts -> buat-pdf.py -> unggah.mts
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const { data, error } = await sb
  .from("submissions")
  .select("id, slug, papan, records(nama_paket, penyedia, nilai_kontrak, tanggal_kontrak, snapshot_tanggal)")
  .eq("jenis", "admin")
  .eq("terbit", true)
  .eq("dinonaktifkan", false);
if (error) throw error;
const rapi = (data ?? []).map((s) => {
  const papan = (s.papan ?? {}) as Record<string, unknown>;
  return {
    id: s.id,
    slug: s.slug,
    papan,
    record: s.records,
  };
});
writeFileSync("scripts/dokumen-demo/proyek.json", JSON.stringify(rapi, null, 1), "utf8");
console.log("jumlah:", rapi.length);
console.log(JSON.stringify(rapi[0], null, 1).slice(0, 1600));
