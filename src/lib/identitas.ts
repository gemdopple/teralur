import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { AuthError, pengaturSesi } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";
import type { AppRole } from "@/lib/roles";
import {
  contractorIdEfektif,
  daftarAdminDari,
  peranEfektif,
  type BarisProfil,
} from "@/lib/peran-akun";

// Identitas server-side per akun: peran dan (untuk kontraktor) id kontraktornya
// dibaca dari tabel `profiles`, bukan dari cookie. Ini menggantikan peran-cookie
// lama sehingga "kontraktor hanya melihat proyeknya sendiri" benar-benar
// ditegakkan di server, bukan sekadar sudut pandang tampilan.
//
// Akun admin lama tetap bekerja tanpa migrasi data: bila sebuah akun tidak punya
// baris `profiles` tetapi emailnya ada di ADMIN_EMAILS, akun itu diperlakukan
// sebagai admin (aturan cadangan peranEfektif).
//
// Logika murni ada di peran-akun.ts agar dapat diuji unit.

export type Identitas = {
  userId: string;
  email: string;
  role: AppRole;
  /** Terisi hanya untuk peran kontraktor yang tertaut ke satu kontraktor. */
  contractorId: string | null;
};

export function adminEmails(): string[] {
  return daftarAdminDari(process.env.ADMIN_EMAILS);
}

/**
 * Identitas pemanggil saat ini. Lempar AuthError 401 bila belum masuk.
 * Membaca `profiles` lewat klien service-role (RLS tanpa policy).
 *
 * Dibungkus React cache(): layout (app) dan halaman sama-sama membaca
 * identitas dalam satu permintaan; tanpa ini setiap pemanggilan mengulang
 * auth.getUser() + kueri profiles — dua round-trip Supabase ekstra per muat
 * halaman. Ruang lingkup cache() adalah satu permintaan, jadi tidak ada
 * kebocoran lintas-pengunjung.
 */
export const identitasSaatIni = cache(async function identitasSaatIni(): Promise<Identitas> {
  // getUser() memanggil Date.now() untuk cek kedaluwarsa token. connection()
  // menandai permintaan ini dinamis sebelum itu, sehingga aman dipanggil dari
  // layout/page yang belum menyentuh data dinamis; tanpa ini route seperti
  // /dashboard/proyek gagal dengan blocking-prerender-current-time.
  await connection();
  const supabase = await pengaturSesi();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AuthError(401, "UNAUTHENTICATED");
  const email = data.user.email ?? "";

  let profil: BarisProfil = null;
  if (databaseConfigured()) {
    const { data: row, error: rowError } = await getSupabaseAdmin()
      .from("profiles")
      .select("role, contractor_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    // Galat baca profil (mis. migrasi 0005 belum diterapkan sehingga tabel
    // `profiles` tidak ada) BUKAN alasan menyatakan sesi tidak sah. Sesi sudah
    // diverifikasi getUser() di atas; memperlakukan galat basis data sebagai
    // "belum masuk" membuat layout (app) mengalihkan ke /login, sedangkan
    // cookie sesi yang masih sah membuat /login mengalihkan balik ke dasbor —
    // loop tanpa akhir. Jatuh ke peran bawaan: admin lewat allowlist, selain
    // itu pemerintah (hak paling sedikit). Gagal aman, tanpa loop.
    profil = rowError ? null : ((row as BarisProfil) ?? null);
    if (rowError) {
      // PGRST205 = tabel tidak ada di skema. Pesan eksplisit supaya penyebab
      // (migrasi belum dijalankan) langsung terbaca; galat lain dilaporkan apa
      // adanya supaya tidak menutupi masalah koneksi/kredensial.
      const petunjuk =
        rowError.code === "PGRST205"
          ? " — jalankan supabase/migrations/0005_contractors.sql pada proyek Supabase ini"
          : "";
      console.error(
        `Profile lookup failed, falling back to allowlist role${petunjuk}: ${rowError.message}`,
      );
    }
  }

  return {
    userId: data.user.id,
    email,
    role: peranEfektif(profil, email, adminEmails()),
    contractorId: contractorIdEfektif(profil),
  };
});

/**
 * Wajib peran tertentu; 403 bila tidak sesuai. Dipakai halaman dasbor dan
 * rute API yang hanya boleh diakses peran tertentu.
 */
export async function requirePeran(...diizinkan: AppRole[]): Promise<Identitas> {
  const identitas = await identitasSaatIni();
  if (!diizinkan.includes(identitas.role)) throw new AuthError(403, "FORBIDDEN");
  return identitas;
}