import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tentang | Teralur" };

export default function AboutPage() {
  const correctionEmail = process.env.NEXT_PUBLIC_CORRECTION_EMAIL;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">Tentang</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Teralur</h1>
      <p className="mt-4 leading-7 text-neutral-700">
        Teralur menghubungkan papan proyek publik dengan informasi lengkap di web. Setiap papan
        memuat kode QR; memindainya membuka dossier proyek berisi chip status, cincin waktu, dan
        catatan pembanding. Tujuannya adalah membuat sumber dan batas informasi lebih mudah
        dipahami—bukan menuduh pihak mana pun.
      </p>
      <section className="mt-6 rounded-xl border-2 border-black bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Data simulasi</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Seluruh data demo di situs ini adalah simulasi buatan tim Teralur untuk lomba. Nama
          proyek, perusahaan, dan instansi di dalamnya rekaan dan tidak merujuk pada entitas
          nyata. Setiap halaman yang berisi data simulasi menampilkan pita
          &ldquo;SIMULASI, BUKAN DATA RESMI&rdquo;. Rincian lengkap ada di{" "}
          <a className="underline" href="/methodology">halaman metodologi</a>.
        </p>
      </section>
      <section className="mt-6 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Koreksi dan klarifikasi</h2>
        {correctionEmail ? (
          <p className="mt-2 text-sm">
            Hubungi <a className="underline" href={`mailto:${correctionEmail}`}>{correctionEmail}</a>.
            Setiap laporan ditinjau oleh tim Teralur.
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
