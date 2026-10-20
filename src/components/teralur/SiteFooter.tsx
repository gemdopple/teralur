import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/15 bg-[#F5F5F5]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-neutral-700 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Sumber data: catatan pengadaan terbuka OCDS, publikasi Opentender oleh ICW. Data
          mengikuti lisensi ODbL; tanggal snapshot ditampilkan pada dossier bila tersedia.
        </p>
        <Link href="/about" className="shrink-0 underline underline-offset-4">
          Tentang Teralur
        </Link>
      </div>
    </footer>
  );
}
