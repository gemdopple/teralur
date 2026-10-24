// Audit kata terlarang (PRD §6.7, Lampiran N.4 — T-29). Dipakai: npm run audit:words -- http://localhost:3000
// Mengambil halaman publik, membuang <script>/<style>/atribut, lalu mencari kata terlarang
// secara tidak peka huruf besar-kecil sebagai kata utuh. Keluar kode 1 bila ada temuan.
// Butuh env: jalankan lewat npm run audit:words (tsx --env-file=.env).
const BASE = process.argv[2] ?? "http://localhost:3000";
const TERLARANG: Array<{ kata: string; pola: RegExp }> = [
  "korupsi",
  "markup",
  "fiktif",
  "curang",
  "penipuan",
  "bermasalah",
  "gelap",
  "terlambat",
  "molor",
  "mangkrak",
  "hilang",
  "disembunyikan",
  "tidak ada",
].map((kata) => ({ kata, pola: new RegExp(`\\b${kata.replace(/ /g, "\\s+")}\\b`, "iu") }));

function buangTag(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/giu, " ")
    .replace(/<style[\s\S]*?<\/style>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&[a-z]+;|&#\d+;/giu, " ")
    .replace(/\s+/gu, " ");
}

async function ambilSlugTerbit(): Promise<string[]> {
  const { createClient } = await import("@supabase/supabase-js");
  const klien = createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false } },
  );
  const { data, error } = await klien
    .from("submissions")
    .select("slug")
    .eq("terbit", true)
    .eq("dinonaktifkan", false);
  if (error) throw new Error(`Gagal membaca daftar dossier: ${error.message}`);
  return (data ?? []).map((b) => b.slug as string);
}

async function periksa(jalur: string): Promise<Array<{ jalur: string; kata: string; konteks: string }>> {
  const temuan: Array<{ jalur: string; kata: string; konteks: string }> = [];
  let html: string;
  try {
    const res = await fetch(`${BASE}${jalur}`, { redirect: "follow" });
    if (!res.ok) {
      console.error(`  ${res.status} ${jalur} (halaman tidak dapat diambil)`);
      return temuan;
    }
    html = await res.text();
  } catch (galat) {
    console.error(`  GAGAL ${jalur}: ${(galat as Error).message}`);
    return temuan;
  }
  const teks = buangTag(html);
  for (const { kata, pola } of TERLARANG) {
    const cocok = pola.exec(teks);
    if (cocok) {
      const awal = Math.max(0, cocok.index - 18);
      temuan.push({ jalur, kata, konteks: teks.slice(awal, awal + 40).trim() });
    }
  }
  return temuan;
}

async function utama(): Promise<void> {
  const jalurStatis = ["/", "/search", "/examples", "/methodology", "/about"];
  const slug = await ambilSlugTerbit();
  const jalurDossier = slug.flatMap((s) => [`/dossiers/${s}`, `/evidence/${s}`]);
  console.log(`Mengaudit ${jalurStatis.length} halaman statis + ${slug.length} dossier terbit...`);
  const semua = await Promise.all([...jalurStatis, ...jalurDossier].map(periksa));
  const temuan = semua.flat();
  if (temuan.length === 0) {
    console.log("Bersih: tidak ada kata terlarang.");
    return;
  }
  for (const t of temuan) console.log(`TEMUAN ${t.jalur} — "${t.kata}" — …${t.konteks}…`);
  process.exit(1);
}

utama().catch((galat) => {
  console.error(galat);
  process.exit(1);
});
