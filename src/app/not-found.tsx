import { ToastKembali } from "@/components/teralur/ToastKembali";

// 404 akar. Sebelumnya konsol admin punya halaman sendiri di /admin; setelah
// konsol dihapus, alamat lama (dan tautan lama yang tersebar di luar aplikasi)
// mendarat di sini. Kini cukup toast + kembali (lihat ToastKembali).
export default function HalamanTidakDitemukan() {
  return <ToastKembali pesan="Halaman tidak ditemukan." />;
}
