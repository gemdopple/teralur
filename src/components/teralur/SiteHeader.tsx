import Link from "next/link";
import { photoFlowEnabled } from "@/lib/flags";
import { TautanNav, type ItemNavPublik } from "@/components/teralur/nav-publik";
import { LogoTeralur } from "@/components/teralur/logo";
import { TombolTema } from "@/components/teralur/tombol-tema";
import { kelasTombol } from "@/lib/kelas-tombol";

// T-38: jalur foto beku. Item "Periksa papan" hanya tampil bila
// PHOTO_FLOW_ENABLED=true. Flag dibaca saat build (dibake ke shell statis);
// perubahan env memerlukan build ulang (di Vercel, perubahan env memicu deploy baru).
//
// Lebar menengah (md–lg, 768–1023px): tautan nav memakai label pendek supaya
// baris tidak melampaui layar tablet (uji: 768px tadinya meluber 20px), dan
// "Masuk" disembunyikan sampai lg karena nav bawah sudah menyediakannya.
//
// Tata letak di lg ke atas: tiga kolom (merek / nav / aksi) dengan dua kolom
// samping `1fr` yang SAMA, bukan `auto`. Dengan `auto 1fr auto`, kolom tengah
// menyerap seluruh sisa ruang dan bergeser ke kiri sebesar selisih lebar merek
// dan blok aksi; dua `1fr` simetris membuat nav benar-benar di tengah header.
//
// Di bawah lg `1fr auto 1fr` justru merusak: "Cari proyek" adalah kolom `auto`
// selebar ~106px, sedangkan merek + nav muat seluruhnya di dalam kolom `1fr`
// kiri. Kolom tengah lalu mengempis ~106px dan baris nav terdorong jauh ke
// kiri — terukur 764px dari blok aksi di 1280px, tepat di rentang tablet dan
// laptop. Karena itu di bawah lg header memakai flex: merek kiri, nav di
// tengah lewat `flex-1` + `justify-center`, aksi kanan. Mulai lg grid simetris
// mengambil alih.
//
// Gaya: kaca tipis (backdrop-blur di atas bg/80) + garis gradasi brand di
// paling atas; logo memakai komponen LogoTeralur bersama.

export function SiteHeader() {
  // Nav sengaja pendek — hanya inti. Contoh kasus, Metodologi, dan Cari paket
  // tetap terjangkau lewat footer (kolom Produk & Transparansi).
  const items: ItemNavPublik[] = [
    { href: "/", label: "Beranda" },
    { href: "/jelajah", label: "Jelajah peta" },
    { href: "/about", label: "Tentang" },
  ];
  if (photoFlowEnabled()) {
    items.splice(2, 0, { href: "/check", label: "Periksa papan" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      {/* Garis gradasi brand: pengganti pita kuning solid */}
      <div aria-hidden className="h-0.5 bg-brand-gradient" />
      {/* flex di bawah lg (nav di tengah sejati), grid simetris di lg ke atas */}
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex h-16 shrink-0 items-center lg:justify-self-start">
          <LogoTeralur ukuran={34} />
        </div>
        <div className="flex h-16 min-w-0 flex-1 items-center justify-center lg:flex-none">
          <TautanNav items={items} />
        </div>
        <div className="flex h-16 shrink-0 items-center gap-2 lg:justify-self-end">
          <TombolTema />
          <Link href="/login" className={`${kelasTombol("outline")} max-lg:hidden`}>
            Masuk
          </Link>
          <Link href="/jelajah" className={kelasTombol("brand")}>
            Cari proyek
          </Link>
        </div>
      </div>
    </header>
  );
}
