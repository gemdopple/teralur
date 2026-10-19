import Link from "next/link";

export default function HalamanUtama() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-12">
      <section className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-600">
          Transparansi Proyek Publik
        </p>
        <h1 className="mt-3 font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">
          Jejak proyek, lebih mudah diperiksa.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-700">
          Catat informasi pada papan proyek dan bandingkan dengan data pengadaan resmi yang tersedia.
          Setiap perbedaan perlu dibaca bersama sumber dan batas datanya.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/check" className="rounded-md border-2 border-black bg-[#FFC400] px-5 py-3 font-bold">
            Periksa papan
          </Link>
          <Link href="/search" className="rounded-md border-2 border-black bg-white px-5 py-3 font-bold">
            Cari paket
          </Link>
        </div>
      </section>
      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {[
          ["Konfirmasi manusia", "Data papan dapat diperiksa dan diperbaiki sebelum pencocokan."],
          ["Jejak sumber", "Lihat asal data, tanggal snapshot, dan cara penghitungan."],
          ["Bahasa netral", "Perbedaan tidak membuktikan kesalahan; perubahan kontrak dapat terjadi."],
        ].map(([title, copy]) => (
          <article key={title} className="rounded-xl border border-black/20 bg-white p-5">
            <h2 className="font-heading text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-700">{copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
