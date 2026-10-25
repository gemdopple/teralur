import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AuthError, getAdminUser } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeluarButton } from "./keluar-button";

// Layout terlindungi untuk semua halaman admin kecuali /admin/login (Lampiran
// I.3). Pemeriksaan ada DI SINI (server): 401 mengalihkan ke /login, 403
// menampilkan halaman tanpa akses. Halaman di dalam grup memeriksa ulang saat
// mengambil data. Cangkang merek ada di layout (app); baris ini hanya
// menambahkan label seksi "Konsol Admin".

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await getAdminUser();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.status === 401) redirect("/login");
      // 403: email tidak terdaftar di allowlist ADMIN_EMAILS.
      return (
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle className="tracking-tight">Tidak punya akses</CardTitle>
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
    <div className="flex-1">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="text-sm">
            <span className="font-semibold text-foreground">Konsol Admin</span>
            <span className="ml-2 text-muted-foreground">kelola proyek, resource, QR, dan laporan</span>
          </p>
          <KeluarButton className="h-8" />
        </div>
      </div>
      {children}
    </div>
  );
}
