import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";

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
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">Cara kerja</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Metodologi dan batas data</h1>
      <p className="mt-3 max-w-3xl text-neutral-700">
        Halaman ini menjelaskan dari mana data berasal, bagaimana status dihitung, dan apa batasnya.
        Dibaca sekitar dua menit.
      </p>

      <section className="mt-6 rounded-xl border-2 border-black bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Asal data</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Data utama di situs ini adalah <strong>simulasi buatan tim Teralur untuk lomba</strong>.
          Nama proyek, perusahaan, dan instansi di dalamnya <strong>rekaan</strong> dan tidak merujuk
          pada entitas nyata. Nilai kontrak dan tanggal dibuat mirip data sebenarnya, tetapi seluruh
          isi papan dimasukkan pengelola dan belum diverifikasi.
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Selain itu, halaman <a className="underline" href="/search">Cari Paket</a> menyediakan data
          nyata yang terpisah: catatan pengadaan OCDS dari publikasi Opentender oleh ICW (subset
          Tangerang). Data nyata ini tidak dicampur dengan data simulasi tanpa label pembeda, dan
          setiap halaman menyebut asal datanya.
          {recordCount !== null
            ? ` Saat ini terdapat ${recordCount.toLocaleString("id-ID")} catatan nyata tersedia, dengan snapshot terbaru ${snapshotDate ?? "belum diketahui"}.`
            : " Jumlah catatan nyata ditampilkan pada halaman ini bila basis data sudah terhubung."}
        </p>
      </section>

      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Tanggal data</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Setiap dossier menampilkan tanggal datanya sendiri pada pita di bagian atas halaman —
          pita SIMULASI untuk proyek buatan tim, atau tanggal snapshot untuk data nyata. Situs ini
          bukan layanan real-time: angka yang Anda lihat adalah keadaan pada tanggal tersebut,
          bukan keadaan hari ini.
        </p>
      </section>

      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Cara status dihitung</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Untuk setiap proyek, tiga field kunci dibandingkan antara tulisan di papan dan catatan
          resmi simulasi:
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
          <li><strong>Nama penyedia:</strong> kemiripan minimal 85%.</li>
          <li><strong>Nama paket:</strong> kemiripan minimal 60%.</li>
          <li><strong>Nilai kontrak:</strong> selisih paling banyak 1%.</li>
        </ul>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Field hanya dibandingkan bila terisi di kedua sisi, dan minimal dua field harus terisi
          agar perbandingan dapat dihitung. Statusnya:
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
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

      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Arti tiap status</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
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

      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Arti label TERCATAT, HITUNGAN, BELUM DIKETAHUI</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Setiap angka dan pernyataan di dossier membawa salah satu dari tiga label:
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
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

      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Cincin waktu</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Cincin waktu membandingkan berapa hari yang telah berjalan dengan total masa kontrak.
          Total hari diambil dari papan, bila kosong dari catatan resmi. Tanggal mulai diambil dari
          tanggal kontrak pada catatan resmi, bila kosong dari papan. Bila keduanya kosong, cincin
          tidak dapat dihitung dan tampil dengan teks &ldquo;Tanggal mulai tidak tersedia&rdquo;.
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Bila hari berjalan melebihi total, cincin menulis &ldquo;Melewati masa kontrak tercatat X
          hari. Addendum atau perpanjangan mungkin ada.&rdquo;
        </p>
        <p className="mt-3 text-sm font-semibold">
          Catatan tetap di bawah cincin: &ldquo;Ini waktu yang telah berjalan, bukan kemajuan
          fisik.&rdquo;
        </p>
      </section>

      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Cara membaca QR</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Papan proyek memuat kode QR. Pindai dengan kamera ponsel untuk membuka dossier proyek
          secara langsung — tanpa langkah perantara. Di bawah QR tercetak alamat lengkap dossier;
          tulisan itu adalah cadangan bila kode tidak terbaca, tinggal diketik di peramban.
        </p>
      </section>

      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Koreksi dan klarifikasi</h2>
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
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Setiap laporan ditinjau oleh tim Teralur. Permintaan koreksi atau penghapusan ditinjau
          dalam 24 jam; halaman yang disengketakan dapat dinonaktifkan sementara proses
          peninjauan berjalan.
        </p>
      </section>

      <section className="mt-5 rounded-xl border-2 border-black bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Batas data</h2>
        <p className="mt-2 text-sm leading-6">
          &ldquo;Halaman ini berisi data simulasi buatan tim Teralur untuk lomba. Bukan data resmi,
          dan tidak merujuk pada proyek, perusahaan, atau instansi nyata. Informasi papan
          dimasukkan pengelola dan tidak diverifikasi. Perbedaan tidak berarti kesalahan. Hubungi
          kami untuk koreksi atau klarifikasi.&rdquo;
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Teralur menampilkan perbedaan antara dua sumber dan menyatakan perbedaan itu perlu
          klarifikasi. Teralur tidak menyatakan ada pelanggaran dan tidak menghitung kemajuan
          fisik proyek.
        </p>
      </section>

      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Atribusi sumber data</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Untuk bagian data nyata pada Cari Paket: data OCDS, publikasi Opentender oleh ICW,
          berlisensi Open Data Commons Open Database License (ODbL). Data simulasi dibuat oleh tim
          Teralur dan ditandai jelas di setiap halamannya.
        </p>
      </section>
    </main>
  );
}
