import { ToastKembali } from "@/components/teralur/ToastKembali";

// Halaman pesan netral (H.1 / 8.4 "Proyek tidak tersedia"): slug belum
// ditemukan, proyek draf, dinonaktifkan, atau sedang ditinjau. Bukan galat
// teknis. Kini cukup toast + kembali (lihat ToastKembali) — pendaratan
// langsung (QR lama) diarahkan ke beranda.
// Next.js menyuntik <meta name="robots" content="noindex"> untuk not-found.
export default function DossierNotFound() {
  return <ToastKembali pesan="Proyek tidak ditemukan atau sedang ditinjau." />;
}
