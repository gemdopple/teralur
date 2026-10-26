// Pipeline dokumen demo (3/3 — unggah): pasang PDF dari
// scripts/dokumen-demo/pdf/<slug>.pdf ke tiap proyek lewat API admin
// (kind=document, idempoten — lewati bila judul sudah ada).
// Jalankan: npx tsx --env-file=.env scripts/dokumen-demo/unggah.mts
// Butuh server produksi lokal berjalan (next start); alamat bisa diarahkan via DOC_BASE_URL.
// Urutan lengkap: ambil-data.mts -> buat-pdf.py -> unggah.mts
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { readFileSync } from "node:fs";

const BASE = process.env.DOC_BASE_URL ?? "http://localhost:3100";

// 1) Sesi admin lewat pola cookie @supabase/ssr yang sama dengan aplikasi.
const store = new Map<string, string>();
const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  cookies: {
    getAll: () => [...store].map(([name, value]) => ({ name, value })),
    setAll: (cs) => cs.forEach((c) => store.set(c.name, c.value)),
  },
});
const { error: errLogin } = await auth.auth.signInWithPassword({
  email: "admin@teralur.test",
  password: process.env.DEV_ADMIN_PASSWORD!,
});
if (errLogin) throw new Error(`login gagal: ${errLogin.message}`);
const cookie = [...store].map(([n, v]) => `${n}=${v}`).join("; ");

// 2) Untuk tiap proyek: lewati bila dokumen dengan judul sama sudah ada,
//    selain itu unggah PDF-nya sebagai resource kind=document.
const svc = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const proyek = JSON.parse(readFileSync("scripts/dokumen-demo/proyek.json", "utf8")) as Array<{
  id: string;
  slug: string;
  papan: Record<string, unknown>;
}>;

for (const p of proyek) {
  const nomor = (p.papan.nomor_kontrak as string) ?? p.slug;
  const judul = `Dokumen kontrak ${nomor}`;
  const { data: ada } = await svc
    .from("resources")
    .select("id, judul")
    .eq("submission_id", p.id);
  if ((ada ?? []).some((r) => r.judul === judul)) {
    console.log(`skip ${p.slug}: "${judul}" sudah ada`);
    continue;
  }
  const pdf = readFileSync(`scripts/dokumen-demo/pdf/${p.slug}.pdf`);
  const fd = new FormData();
  fd.append("kind", "document");
  fd.append("title", judul);
  fd.append("file", new Blob([pdf], { type: "application/pdf" }), `dokumen-${p.slug}.pdf`);
  const res = await fetch(`${BASE}/api/admin/projects/${p.id}/resources`, {
    method: "POST",
    headers: { cookie },
    body: fd,
  });
  const body = (await res.json().catch(() => ({}))) as { resource?: { id?: string }; error?: { message?: string } };
  console.log(`${res.status} ${p.slug} "${judul}" ${body.resource?.id ?? body.error?.message ?? ""}`);
}
