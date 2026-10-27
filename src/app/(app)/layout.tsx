import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthError } from "@/lib/admin-auth";
import { identitasSaatIni } from "@/lib/identitas";
import { ShellDasbor } from "@/components/teralur/shell-dasbor";

// Cangkang dasbor (redesign v2): pemeriksaan sesi di server (I.3, lapis
// pertama), lalu sidebar peran. Peran berasal dari data akun server-side
// (profiles) — bukan cookie — sehingga hak akses dan penyaringan proyek
// kontraktor ditegakkan di sini, bukan sekadar sudut pandang tampilan.
// instant=false: pemeriksaan sesi memblokir sebelum stream sehingga pengunjung
// tanpa sesi menerima pengalihan sungguhan ke /login, bukan cangkang kosong.
export const instant = false;

export default async function LayoutApp({ children }: { children: ReactNode }) {
  let identitas;
  try {
    identitas = await identitasSaatIni();
  } catch (error) {
    if (error instanceof AuthError) {
      // 401 selalu berarti belum masuk. 403 juga diarahkan ke /login: peran
      // ditentukan akun, jadi akun tanpa profil yang sah tidak punya dasbor.
      redirect("/login");
    }
    // Selain AuthError (mis. klien Supabase gagal dibuat karena lingkungan
    // belum dikonfigurasi): verifikasi tidak mungkin, perlakukan seperti
    // belum masuk — jangan tampilkan isi dasbor.
    redirect("/login");
  }

  const email = identitas.email || "Pengelola";

  return (
    <ShellDasbor email={email} peran={identitas.role}>
      {children}
    </ShellDasbor>
  );
}
