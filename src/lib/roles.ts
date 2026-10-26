// Model peran untuk dasbor (redesign v2). Autentikasi tetap Supabase dengan
// allowlist admin (src/lib/admin-auth.ts); peran menentukan sudut pandang
// dasbor dan disimpan pada cookie `teralur_role` yang diatur di halaman masuk.
// Data aplikasi adalah simulasi, jadi peran berfungsi sebagai mode sudut
// pandang demo — satu akun dapat meninjau dasbor tiap peran.

export type AppRole = "pemerintah" | "kontraktor" | "admin";

export const ROLE_COOKIE = "teralur_role";

export const DAFTAR_ROLE: AppRole[] = ["pemerintah", "kontraktor", "admin"];

export function peranDariNilai(nilai: string | undefined | null): AppRole {
  return DAFTAR_ROLE.find((peran) => peran === nilai) ?? "pemerintah";
}

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
      "Buat proyek, unggah resource, terbitkan dossier, unduh QR, dan moderasi laporan warga lewat konsol admin.",
  },
};

export type ItemNav = {
  href: string;
  label: string;
  peran: AppRole[];
};

export const NAV_DASBOR: ItemNav[] = [
  { href: "/dashboard", label: "Ringkasan", peran: ["pemerintah", "kontraktor", "admin"] },
  { href: "/dashboard/proyek", label: "Proyek", peran: ["pemerintah", "kontraktor", "admin"] },
  { href: "/dashboard/peta", label: "Peta proyek", peran: ["pemerintah", "kontraktor", "admin"] },
  { href: "/dashboard/laporan", label: "Laporan warga", peran: ["pemerintah"] },
  { href: "/dashboard/pengaturan", label: "Pengaturan", peran: ["pemerintah", "kontraktor", "admin"] },
];

export function navUntukRole(peran: AppRole): ItemNav[] {
  return NAV_DASBOR.filter((item) => item.peran.includes(peran));
}

/** Simpan peran pada cookie (sisi klien, dipanggil dari penangan aksi). */
export function simpanCookiePeran(peran: AppRole): void {
  document.cookie = `${ROLE_COOKIE}=${peran}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}
