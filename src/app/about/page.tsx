import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tentang | Teralur" };

export default function AboutPage() {
  const correctionEmail = process.env.NEXT_PUBLIC_CORRECTION_EMAIL;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">Tentang</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Teralur</h1>
      <p className="mt-4 leading-7 text-neutral-700">
        Teralur membantu warga menelusuri informasi pada papan proyek dan membandingkannya dengan
        catatan pengadaan publik yang tersedia. Tujuannya adalah membuat sumber dan batas informasi
        lebih mudah dipahami—bukan menuduh pihak mana pun.
      </p>
      <section className="mt-6 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Koreksi dan klarifikasi</h2>
        {correctionEmail ? (
          <p className="mt-2 text-sm">
            Hubungi <a className="underline" href={`mailto:${correctionEmail}`}>{correctionEmail}</a>.
          </p>
        ) : (
          <p className="mt-2 text-sm text-neutral-700">
            Alamat koreksi belum dipublikasikan. Teralur belum menerima permintaan koreksi melalui aplikasi.
          </p>
        )}
      </section>
    </main>
  );
}
