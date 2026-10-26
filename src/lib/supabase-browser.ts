import type { SupabaseClient } from "@supabase/supabase-js";

// Klien Supabase sisi browser (PRD v1.1 Lampiran I.3: login memanggil
// signInWithPassword dari klien). Hanya kunci anon NEXT_PUBLIC_* — jangan pernah
// mengimpor modul ini dari kode server dan jangan memakai kunci service role.
//
// Paket @supabase/ssr diimpor DINAMIS: bundelnya tidak ikut grafik awal halaman,
// sehingga halaman publik tetap tampil penuh meski lingkungan belum
// dikonfigurasi (mode cadangan) — modul hanya dimuat saat sesi dicek/dipakai.

let klien: SupabaseClient | null = null;

export async function getSupabaseBrowser(): Promise<SupabaseClient> {
  if (klien !== null) return klien;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !kunci) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (client env)",
    );
  }
  const { createBrowserClient } = await import("@supabase/ssr");
  klien = createBrowserClient(url, kunci);
  return klien;
}
