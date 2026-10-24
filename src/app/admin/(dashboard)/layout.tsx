import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AuthError, getAdminUser } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeluarButton } from "./keluar-button";

// Layout terlindungi untuk semua halaman admin kecuali /admin/login (Lampiran
// I.3). Pemeriksaan ada DI SINI (server), bukan hanya di middleware: 401
// mengalihkan ke /admin/login, 403 menampilkan halaman tanpa akses. Halaman di
// dalam grup memeriksa ulang saat mengambil data.

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await getAdminUser();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.status === 401) redirect("/admin/login");
      // 403: email tidak ada di allowlist ADMIN_EMAILS.
      return (
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Tidak punya akses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Akun ini tidak punya akses admin.</p>
              <KeluarButton />
            </CardContent>
          </Card>
        </main>
      );
    }
    throw error;
  }

  return (
    <>
      <div className="border-b-2 border-black bg-kuning-papan">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/admin"
            className="font-heading text-xl font-extrabold tracking-tight"
          >
            teralur <span className="align-middle text-sm font-semibold uppercase tracking-widest">Admin</span>
          </Link>
          <KeluarButton className="h-8" />
        </div>
      </div>
      {children}
    </>
  );
}
