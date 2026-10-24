import Link from "next/link";

// Halaman pesan netral (H.1 / 8.4 "Proyek tidak tersedia"): slug belum
// ditemukan, proyek draf, dinonaktifkan, atau sedang ditinjau. Bukan galat teknis.
// Next.js menyuntik <meta name="robots" content="noindex"> untuk not-found.
export default function DossierNotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <div className="rounded-xl border-2 border-black bg-white p-6 text-center sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">
          Dossier proyek
        </p>
        <h1 className="mt-2 font-heading text-2xl font-extrabold sm:text-3xl">
          Proyek tidak ditemukan atau sedang ditinjau. Coba Cari Paket.
        </h1>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/search"
            className="inline-flex min-h-11 items-center rounded-md border-2 border-black bg-kuning-papan px-4 py-2 font-semibold"
          >
            Cari Paket
          </Link>
          <Link
            href="/methodology"
            className="inline-flex min-h-11 items-center rounded-md border-2 border-black bg-white px-4 py-2 font-semibold"
          >
            Metodologi
          </Link>
        </div>
      </div>
    </main>
  );
}
