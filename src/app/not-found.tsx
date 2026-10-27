import Link from "next/link";
import { kelasTombol } from "@/lib/kelas-tombol";

// 404 akar. Sebelumnya konsol admin punya halaman sendiri di /admin; setelah
// konsol dihapus, alamat lama (dan tautan lama yang tersebar di luar aplikasi)
// mendarat di sini, bukan di halaman bawaan Next yang kosong.
export default function HalamanTidakDitemukan() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-20">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        Halaman tidak ditemukan.
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Alamat ini tidak tersedia. Semua pengelolaan proyek, resource, QR, dan laporan warga kini
        ada di dasbor.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/dashboard" className={kelasTombol()}>
          Buka dasbor
        </Link>
        <Link href="/" className={kelasTombol("outline")}>
          Ke beranda
        </Link>
      </div>
    </main>
  );
}