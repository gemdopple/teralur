import { NextResponse, type NextRequest } from "next/server";

// Pr bodies: respons 404 sungguhan untuk dossier/kartu bukti yang tidak ada,
// berupa draf, atau ditarik (Lampiran H.1). Dengan cacheComponents, notFound()
// di halaman dinamis menjadi "soft 404" (200 + noindex) karena shell sudah
// terkirim; docs loading.md §Status codes menyarankan pemeriksaan slug di
// Proxy agar status 404 diputuskan sebelum render. Pemeriksaan sengaja ringan
// (satu lookup kunci unik, tanpa konten) dan halaman tetap memeriksa ulang
// di server sebagai lapis kedua.
//
// Matcher sengaja satu segmen: /evidence/{slug}/opengraph-image tidak lewat
// sini agar gambar generik (H.4) tetap terbit untuk slug yang tidak tersedia.

export const config = {
  matcher: ["/dossiers/:slug", "/evidence/:slug"],
};

const POLA_SLUG = /^[A-Za-z0-9_-]{1,64}$/;

function halamanNetral404(): Response {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Proyek tidak ditemukan | teralur</title>
<style>
  body { margin: 0; font-family: system-ui, "Segoe UI", Roboto, sans-serif; background: #F5F5F5; color: #14110F; }
  header { border-bottom: 2px solid #14110F; background: #FFC400; }
  header div { max-width: 60rem; margin: 0 auto; padding: 1rem; font-weight: 800; font-size: 1.5rem; }
  main { max-width: 48rem; margin: 0 auto; padding: 4rem 1rem; }
  .kartu { border: 2px solid #14110F; border-radius: 0.75rem; background: #fff; padding: 2.5rem; text-align: center; }
  .kicker { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #6B6F76; margin: 0 0 0.5rem; }
  h1 { font-size: 1.6rem; margin: 0; }
  .aksi { margin-top: 1.5rem; display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
  a { min-height: 44px; display: inline-flex; align-items: center; padding: 0.5rem 1rem; border: 2px solid #14110F; border-radius: 0.375rem; font-weight: 600; color: #14110F; text-decoration: none; }
  a.kuning { background: #FFC400; }
</style>
</head>
<body>
<header><div>teralur</div></header>
<main>
  <div class="kartu">
    <p class="kicker">Dossier proyek</p>
    <h1>Proyek tidak ditemukan atau sedang ditinjau. Coba Cari Paket.</h1>
    <div class="aksi">
      <a class="kuning" href="/search">Cari Paket</a>
      <a href="/methodology">Metodologi</a>
    </div>
  </div>
</main>
</body>
</html>`;
  return new Response(html, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function proxy(request: NextRequest): Promise<Response> {
  const slug = request.nextUrl.pathname.split("/")[2] ?? "";
  if (!POLA_SLUG.test(slug)) return halamanNetral404();

  const url = process.env.SUPABASE_URL;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !kunci) return NextResponse.next(); // env belum diisi: biarkan halaman menangani

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, kunci, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("submissions")
      .select("slug")
      .eq("slug", slug)
      .eq("terbit", true)
      .eq("dinonaktifkan", false)
      .limit(1);
    // Galat basis data: lewatkan ke halaman (fallback soft-404 netral di sana).
    if (error) return NextResponse.next();
    if (!data || data.length === 0) return halamanNetral404();
  } catch {
    return NextResponse.next();
  }
  return NextResponse.next();
}
