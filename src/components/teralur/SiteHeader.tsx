import Link from "next/link";
import { photoFlowEnabled } from "@/lib/flags";
import { TautanNav, type ItemNavPublik } from "@/components/teralur/nav-publik";
import { kelasTombol } from "@/lib/kelas-tombol";

// T-38: jalur foto beku. Item "Periksa papan" hanya tampil bila
// PHOTO_FLOW_ENABLED=true. Flag dibaca saat build (dibake ke shell statis);
// perubahan env memerlukan build ulang (di Vercel, perubahan env memicu deploy baru).

export function SiteHeader() {
  const items: ItemNavPublik[] = [
    { href: "/", label: "Beranda" },
    { href: "/jelajah", label: "Jelajah peta" },
    { href: "/examples", label: "Contoh kasus" },
    { href: "/methodology", label: "Metodologi" },
    { href: "/about", label: "Tentang" },
  ];
  if (photoFlowEnabled()) {
    items.splice(2, 0, { href: "/check", label: "Periksa papan" });
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-border">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Teralur, ke beranda">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-[0.6rem] bg-kuning-papan font-heading text-lg leading-none font-bold text-hitam-aspal"
          >
            t
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">teralur</span>
        </Link>
        <div className="flex items-center gap-2">
          <TautanNav items={items} />
          <Link
            href="/login"
            className={`${kelasTombol("outline")} max-sm:hidden`}
          >
            Masuk
          </Link>
          <Link href="/jelajah" className={`${kelasTombol()} max-sm:hidden`}>
            Cari proyek
          </Link>
        </div>
      </div>
    </header>
  );
}
