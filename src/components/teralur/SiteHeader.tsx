import Link from "next/link";
import { photoFlowEnabled } from "@/lib/flags";

const navItems = [
  { href: "/check", label: "Periksa papan" },
  { href: "/search", label: "Cari paket" },
  { href: "/examples", label: "Contoh kasus" },
  { href: "/methodology", label: "Metodologi" },
];

export function SiteHeader() {
  // T-38: jalur foto beku. Item "Periksa papan" hanya tampil bila
  // PHOTO_FLOW_ENABLED=true. Flag dibaca saat build (dibake ke shell statis);
  // perubahan env memerlukan build ulang (di Vercel, perubahan env memicu deploy baru).
  const items = photoFlowEnabled()
    ? navItems
    : navItems.filter((item) => item.href !== "/check");

  return (
    <header className="border-b-2 border-black bg-[#FFC400]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-heading text-2xl font-extrabold tracking-tight">
          teralur
        </Link>
        <nav aria-label="Navigasi utama" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="underline-offset-4 hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
