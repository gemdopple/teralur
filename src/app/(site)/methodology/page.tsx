import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";
import { Reveal } from "@/components/teralur/anim/Reveal";

export const metadata: Metadata = { title: "Metodologi | Teralur" };

export default function MethodologyPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">Memuat ringkasan data…</main>}>
      <MethodologyContent />
    </Suspense>
  );
}

async function MethodologyContent() {
  await connection();
  let recordCount: number | null = null;
  let snapshotDate: string | null = null;
  if (databaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase.from("records").select("*", { count: "exact", head: true });
    if (!error) recordCount = count ?? 0;
    const { data, error: snapshotError } = await supabase
      .from("records")
      .select("snapshot_tanggal")
      .order("snapshot_tanggal", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!snapshotError) snapshotDate = data?.snapshot_tanggal ?? null;
  }

  const correctionEmail = process.env.NEXT_PUBLIC_CORRECTION_EMAIL;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <Reveal>
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-medium text-muted-foreground">
          <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
          Cara kerja
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Metodologi dan batas data</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Halaman ini menjelaskan dari mana data berasal, bagaimana status dihitung, dan apa batasnya.
          Dibaca sekitar dua menit.
        </p>
      </Reveal>

      <div className="mt-8 space-y-5">
        <Reveal>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 01
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Asal data</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Data utama di situs ini adalah <strong>data proyek yang dikelola langsung oleh tim
              Teralur</strong>. Setiap halaman menampilkan sumber serta tanggal snapshot-nya. Isi papan
              dimasukkan pengelola dan belum diverifikasi.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Selain itu, halaman <a className="underline" href="/search">Cari Paket</a> menyediakan data
              nyata yang terpisah: catatan pengadaan OCDS dari publikasi Opentender oleh ICW (subset
              Tangerang). Kedua sumber data ini terpisah, dan setiap halaman menyebut asal datanya.
              {recordCount !== null
                ? ` Saat ini terdapat ${recordCount.toLocaleString("id-ID")} catatan nyata tersedia, dengan snapshot terbaru ${snapshotDate ?? "belum diketahui"}.`
                : " Jumlah catatan nyata ditampilkan pada halaman ini bila basis data sudah terhubung."}
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 02
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Tanggal data</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Setiap dossier menampilkan tanggal datanya sendiri pada pita di bagian atas halaman.
              Situs ini bukan layanan real-time: angka yang Anda lihat adalah keadaan pada tanggal
              tersebut, bukan keadaan hari ini.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 03
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Cara status dihitung</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Untuk setiap proyek, tiga field kunci dibandingkan antara tulisan di papan dan catatan
              catatan resmi:
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li><strong>Nama penyedia:</strong> kemiripan minimal 85%.</li>
              <li><strong>Nama paket:</strong> kemiripan minimal 60%.</li>
              <li><strong>Nilai kontrak:</strong> selisih paling banyak 1%.</li>
            </ul>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Field hanya dibandingkan bila terisi di kedua sisi, dan minimal dua field harus terisi
              agar perbandingan dapat dihitung. Statusnya:
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li>
                <strong>Cocok:</strong> semua field yang dibandingkan lulus ambang di atas.
              </li>
              <li>
                <strong>Selisih:</strong> tepat satu field tidak lulus sementara dua lainnya lulus.
                Kedua nilai ditampilkan berdampingan dan field yang berbeda disebut.
              </li>
              <li>
                <strong>Tidak ditemukan:</strong> keadaan lainnya, termasuk bila catatan pembanding
                belum tersedia.
              </li>
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 04
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Arti tiap status</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li><strong>Cocok</strong> — tulisan di papan sejalan dengan catatan resmi.</li>
              <li>
                <strong>Selisih</strong> — ada perbedaan yang perlu klarifikasi. Perbedaan sering wajar,
                misalnya karena addendum atau perubahan kontrak; perbedaan tidak berarti kesalahan.
              </li>
              <li>
                <strong>Tidak ditemukan</strong> — tulisan di papan belum ditemukan di data yang kami
                miliki. Belum ditemukan bukan berarti sesuatu salah.
              </li>
              <li>
                <strong>Catatan resmi</strong> — hasil pencarian data tanpa papan proyek untuk
                dibandingkan.
              </li>
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 05
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Arti label TERCATAT, HITUNGAN, BELUM DIKETAHUI</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Setiap angka dan pernyataan di dossier membawa salah satu dari tiga label:
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li>
                <strong>TERCATAT:</strong> dibaca langsung dari papan yang dikonfirmasi pengguna atau
                dari catatan resmi.
              </li>
              <li>
                <strong>HITUNGAN:</strong> diturunkan dari data tercatat dengan rumus yang tertulis,
                misalnya hari ke-74 dari 90.
              </li>
              <li>
                <strong>BELUM DIKETAHUI:</strong> datanya belum tersedia atau tidak dapat disimpulkan,
                misalnya persen kemajuan fisik.
              </li>
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 06
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Cincin waktu</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Cincin waktu membandingkan berapa hari yang telah berjalan dengan total masa kontrak.
              Total hari diambil dari papan, bila kosong dari catatan resmi. Tanggal mulai diambil dari
              tanggal kontrak pada catatan resmi, bila kosong dari papan. Bila keduanya kosong, cincin
              tidak dapat dihitung dan tampil dengan teks &ldquo;Tanggal mulai tidak tersedia&rdquo;.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Bila hari berjalan melebihi total, cincin menulis &ldquo;Melewati masa kontrak tercatat X
              hari. Addendum atau perpanjangan mungkin ada.&rdquo;
            </p>
            <p className="mt-3 text-sm font-semibold">
              Catatan tetap di bawah cincin: &ldquo;Ini waktu yang telah berjalan, bukan kemajuan
              fisik.&rdquo;
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 07
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Cara membaca QR</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Papan proyek memuat kode QR. Pindai dengan kamera ponsel untuk membuka dossier proyek
              secara langsung — tanpa langkah perantara. Di bawah QR tercetak alamat lengkap dossier;
              tulisan itu adalah cadangan bila kode tidak terbaca, tinggal diketik di peramban.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 08
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Koreksi dan klarifikasi</h2>
            {correctionEmail ? (
              <p className="mt-2 text-sm leading-6">
                Menurut Anda ada data yang perlu diperbaiki? Kirim surel ke{" "}
                <a className="underline" href={`mailto:${correctionEmail}`}>{correctionEmail}</a>.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-6">
                Menurut Anda ada data yang perlu diperbaiki? Alamat surel koreksi akan dipublikasikan
                pada halaman ini.
              </p>
            )}
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Setiap laporan ditinjau oleh tim Teralur. Permintaan koreksi atau penghapusan ditinjau
              dalam 24 jam; halaman yang disengketakan dapat dinonaktifkan sementara proses
              peninjauan berjalan.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 09
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Batas data</h2>
            <p className="mt-2 text-sm leading-6">
              &ldquo;Informasi papan dimasukkan atau dikonfirmasi pengguna dan belum diverifikasi tim
              Teralur. Catatan resmi berasal dari data publik per snapshot yang tersedia dan mungkin
              belum memuat perubahan kontrak. Perbedaan tidak berarti kesalahan. Hubungi kami untuk
              koreksi atau klarifikasi.&rdquo;
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Teralur menampilkan perbedaan antara dua sumber dan menyatakan perbedaan itu perlu
              klarifikasi. Teralur tidak menyatakan ada pelanggaran dan tidak menghitung kemajuan
              fisik proyek.
            </p>
          </section>
        </Reveal>

        <Reveal>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-kuning-papan" />
              Bagian 10
            </p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight">Atribusi sumber data</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Untuk bagian data nyata pada Cari Paket: data OCDS, publikasi Opentender oleh ICW,
              berlisensi Open Data Commons Open Database License (ODbL). Data proyek dikelola tim
              Teralur dengan tanggal snapshot pada setiap halamannya.
            </p>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
