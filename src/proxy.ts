import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Pr bodies: respons 404 sungguhan untuk dossier/kartu bukti yang tidak ada,
// berupa draf, atau ditarik (Lampiran H.1). Dengan cacheComponents, notFound()
// di halaman dinamis menjadi "soft 404" (200 + noindex) karena shell sudah
// terkirim; docs loading.md §Status codes menyarankan pemeriksaan slug di
// Proxy agar status 404 diputuskan sebelum render. Pemeriksaan sengaja ringan
// (satu lookup kunci unik, tanpa konten) dan halaman tetap memeriksa ulang
// di server sebagai lapis kedua.
//
// Matcher sengaja satu segmen: /evidence/{slug}/opengraph-image tidak lewat
// sini agar gambar generik (H.4) tetap tersedia untuk slug yang tidak ada.

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/contractor/:path*",
    "/dossiers/:slug",
    "/evidence/:slug",
  ],
};

const POLA_SLUG = /^[A-Za-z0-9_-]{1,64}$/;

function halamanNetral404(): Response {
  // Pola yang sama dengan ToastKembali (halaman 404 aplikasi): cukup pemberitahuan
  // gaya toast lalu kembali ke halaman sebelumnya; pendaratan langsung (QR lama
  // tanpa referrer) diarahkan ke beranda. Status tetap 404 sungguhan (H.1).
  // Halaman ini di luar React — toast dibuat HTML murni, dengan jeda singkat
  // agar pesan sempat terbaca sebelum navigasi.
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Proyek tidak ditemukan | teralur</title>
<style>
  body { margin: 0; font-family: system-ui, "Segoe UI", Roboto, sans-serif; background: #FCFCFA; color: #14110F; }
  #pemberitahuan { position: fixed; top: 1rem; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; align-items: center; gap: 0.625rem; max-width: 92vw; padding: 0.75rem 1rem; border: 1px solid rgb(20 17 15 / 12%); border-radius: 0.5rem; background: #fff; color: #14110F; font-size: 0.875rem; font-weight: 500; line-height: 1.4; box-shadow: 0 8px 24px rgb(20 17 15 / 0.14); }
  #pemberitahuan span { display: inline-flex; width: 1.25rem; height: 1.25rem; flex: none; align-items: center; justify-content: center; border-radius: 9999px; background: #D9480F; color: #fff; font-size: 0.75rem; font-weight: 700; }
</style>
</head>
<body>
<div id="pemberitahuan" role="status"><span aria-hidden="true">!</span>Proyek tidak ditemukan atau sedang ditinjau.</div>
<script>
  setTimeout(function () {
    if (document.referrer) { history.back(); } else { location.replace("/"); }
  }, 1500);
</script>
</body>
</html>`;
  return new Response(html, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function proxy(request: NextRequest): Promise<Response> {
  const { pathname } = request.nextUrl;
  const perluPerbaruiSesi =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/api/contractor/");
  if (perluPerbaruiSesi) {
    return perbaruiSesiSupabase(request);
  }

  const slug = pathname.split("/")[2] ?? "";
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

async function perbaruiSesiSupabase(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !kunci) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, kunci, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
      },
    },
  });

  // Refreshes expired access tokens and forwards the updated cookies to both
  // the current request and the browser before page/API auth checks run.
  await supabase.auth.getUser();
  return response;
}
