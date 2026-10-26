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

export async function getAdminUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // Route handler tidak perlu menulis cookie sesi di sini; refresh token
        // ditangani middleware/client. setAll no-op aman di konteks ini.
        setAll: () => {},
      },
    },
  );
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
