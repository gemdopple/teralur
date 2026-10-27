// Model peran untuk dasbor (redesign v2). Autentikasi tetap Supabase, tetapi
// peran kini berasal dari data akun server-side (tabel `profiles`, lihat
// src/lib/identitas.ts) — BUKAN lagi dari cookie yang bisa diubah pengguna.
// Dengan begitu "kontraktor hanya melihat proyeknya sendiri" dapat ditegakkan.
// Modul ini hanya menyimpan definisi peran, label, dan navigasi (murni/klien).

export type AppRole = "pemerintah" | "kontraktor" | "admin";

export const DAFTAR_ROLE: AppRole[] = ["pemerintah", "kontraktor", "admin"];

export type MetaRole = {
  peran: AppRole;
  label: string;
  ringkas: string;
  deskripsi: string;
};

export const META_ROLE: Record<AppRole, MetaRole> = {
  pemerintah: {
    peran: "pemerintah",
    label: "Pemerintah",
    ringkas: "Pantau seluruh proyek daerah",
    deskripsi:
      "Kelola daftar proyek, pantau selisih yang perlu klarifikasi, dan baca laporan warga untuk wilayah kerja Anda.",
  },
  kontraktor: {
    peran: "kontraktor",
    label: "Kontraktor",
    ringkas: "Proyek Anda dalam satu pandangan",
    deskripsi:
      "Lihat proyek yang sedang berjalan, masa pelaksanaan, dan kelengkapan data papan untuk setiap penugasan.",
  },
  admin: {
    peran: "admin",
    label: "Admin",
    ringkas: "Kelola isi situs",
    deskripsi:
      "Buat dan ubah proyek, tetapkan kontraktor, unggah resource, terbitkan dossier, unduh QR, dan moderasi laporan warga — semuanya dari dasbor.",
  },
};

export type AnakNav = {
  href: string;
  label: string;
};

export type ItemNav = {
  /** Untuk pencocokan pathname aktif. Induk beranak tidak menavigasi ke sini. */
  href: string;
  label: string;
  peran: AppRole[];
  /** Sub-menu (dropdown satu tingkat). Induk beranak adalah pengalih, bukan tautan. */
  anak?: AnakNav[];
};

export const NAV_DASBOR: ItemNav[] = [
  { href: "/dashboard", label: "Ringkasan", peran: ["pemerintah", "kontraktor", "admin"] },
  { href: "/dashboard/proyek", label: "Proyek", peran: ["pemerintah", "kontraktor", "admin"] },
  { href: "/dashboard/peta", label: "Peta proyek", peran: ["pemerintah", "kontraktor", "admin"] },
  // Admin dimoderasi laporan warga per proyek (halaman kelola) dan melihat
  // seluruhnya di sini — kemampuan admin mencakup peran pemerintah.
  { href: "/dashboard/laporan", label: "Laporan warga", peran: ["pemerintah", "admin"] },
  // Pengelolaan akun login per peran. Hanya admin yang membuat akun.
  {
    href: "/dashboard/akun",
    label: "Akun",
    peran: ["admin"],
    anak: [
      { href: "/dashboard/akun/pemerintah", label: "Pemerintah" },
      { href: "/dashboard/akun/kontraktor", label: "Kontraktor" },
    ],
  },
];

export function navUntukRole(peran: AppRole): ItemNav[] {
  return NAV_DASBOR.filter((item) => item.peran.includes(peran));
}

/** Apakah item (atau salah satu anaknya) cocok dengan pathname aktif. */
export function navAktif(item: ItemNav, pathname: string): boolean {
  const cocok = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname === href || pathname.startsWith(`${href}/`);
  return cocok(item.href) || (item.anak ?? []).some((anak) => cocok(anak.href));
}
