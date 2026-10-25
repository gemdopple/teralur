import type { Metadata } from "next";
import { Reveal } from "@/components/teralur/anim/Reveal";

export const metadata: Metadata = { title: "Tentang | Teralur" };

export default function AboutPage() {
  const correctionEmail = process.env.NEXT_PUBLIC_CORRECTION_EMAIL;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Reveal>
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-medium text-muted-foreground">
          <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
          Tentang
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Teralur</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Teralur menghubungkan papan proyek publik dengan informasi lengkap di web. Setiap papan
          memuat kode QR; memindainya membuka dossier proyek berisi chip status, cincin waktu, dan
          catatan pembanding. Tujuannya adalah membuat sumber dan batas informasi lebih mudah
          dipahami—bukan menuduh pihak mana pun.
        </p>
      </Reveal>
      <div className="mt-8 space-y-5">
        <Reveal>
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 01
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Data terbuka</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Data papan dan catatan resmi dikelola tim Teralur dan diperbarui berkala, dengan
              sumber serta tanggal snapshot ditampilkan pada setiap halaman. Rincian lengkap ada di{" "}
              <a className="underline" href="/methodology">halaman metodologi</a>.
            </p>
          </section>
        </Reveal>
        <Reveal>
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 02
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Koreksi dan klarifikasi</h2>
            {correctionEmail ? (
              <p className="mt-2 text-sm">
                Hubungi <a className="underline" href={`mailto:${correctionEmail}`}>{correctionEmail}</a>.
                Setiap laporan ditinjau oleh tim Teralur.
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Alamat koreksi belum dipublikasikan. Teralur belum menerima permintaan koreksi melalui aplikasi.
              </p>
            )}
          </section>
        </Reveal>
      </div>
    </main>
  );
}
