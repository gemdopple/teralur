import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Autentikasi admin (PRD v1.1 Lampiran I.2). Nama file mengikuti pola repo
// (`admin-*.ts`), isi sesuai lampiran: verifikasi lewat getUser() (bukan
// getSession), lalu cek allowlist ADMIN_EMAILS. Middleware saja tidak cukup.

export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    public code: "UNAUTHENTICATED" | "FORBIDDEN",
  ) {
    super(code);
  }
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Klien Supabase yang membaca sesi dari cookie permintaan.
 *
 * Penting dengan cacheComponents: `auth.getUser()` memanggil `Date.now()` untuk
 * memeriksa kedaluwarsa token. Bila dipanggil sebelum permintaan ditandai
 * dinamis, Next melempar blocking-prerender-current-time untuk route tersebut.
 * Pemanggil layout/halaman yang belum menyentuh data dinamis wajib
 * `await connection()` lebih dulu; route handler dan halaman yang sudah
 * membaca cookies/data otomatis dinamis.
 */
export async function pengaturSesi() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // Proxy menyegarkan sesi dan menulis cookie sebelum halaman/API berjalan.
        setAll: () => {},
      },
    },
  );
}

export async function getAdminUser() {
  const supabase = await pengaturSesi();
  // getUser memverifikasi token ke server Auth; jangan mengandalkan getSession saja
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AuthError(401, "UNAUTHENTICATED");
  const email = data.user.email?.toLowerCase();
  if (!email || !adminEmails().includes(email)) throw new AuthError(403, "FORBIDDEN");
  return data.user;
}

// Untuk route handler /api/admin/*: panggil paling awal, sebelum membaca body.
// Lempar AuthError; handler menerjemahkannya via adminErrorResponse() (admin-http.ts).
export async function requireAdmin() {
  return getAdminUser();
}
