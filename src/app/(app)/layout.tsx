import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AuthError, getAdminUser } from "@/lib/admin-auth";
import { ShellDasbor } from "@/components/teralur/shell-dasbor";
import { peranDariNilai, ROLE_COOKIE } from "@/lib/roles";
import { kelasTombol } from "@/lib/kelas-tombol";

// Cangkang dasbor (redesign v2): pemeriksaan sesi + allowlist di server (I.3,
// lapis pertama), lalu sidebar peran. Peran adalah mode sudut pandang demo
// (cookie), bukan klaim keamanan — akses tetap ditentukan ADMIN_EMAILS.
// instant=false: pemeriksaan sesi memblokir sebelum stream sehingga pengunjung
// tanpa sesi menerima pengalihan sungguhan ke /login, bukan cangkang kosong.
export const instant = false;

export default async function LayoutApp({ children }: { children: ReactNode }) {
  let email: string;
  try {
    const user = await getAdminUser();
    email = user.email ?? "Pengelola";
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.status === 401) redirect("/login");
      return (
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
          <h1 className="font-heading text-2xl font-bold">Akun ini tidak punya akses admin.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Pendaftaran mandiri dimatikan. Hubungi pengelola situs untuk memasukkan email Anda ke
            daftar akun pengelola.
          </p>
          <Link href="/" className={`${kelasTombol("outline")} mt-6 w-fit`}>
            Kembali ke beranda
          </Link>
        </main>
      );
    }
    // Selain AuthError (mis. klien Supabase gagal dibuat karena lingkungan
    // belum dikonfigurasi): verifikasi tidak mungkin, perlakukan seperti
    // belum masuk — jangan tampilkan isi dasbor.
    redirect("/login");
  }

  const cookieStore = await cookies();
  const peran = peranDariNilai(cookieStore.get(ROLE_COOKIE)?.value);

  return (
    <ShellDasbor email={email} peran={peran}>
      {children}
    </ShellDasbor>
  );
}
