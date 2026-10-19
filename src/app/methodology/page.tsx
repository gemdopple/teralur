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
    if (error) throw new Error(`Gagal menghitung catatan resmi: ${error.message}`);
    recordCount = count ?? 0;
    const { data, error: snapshotError } = await supabase
      .from("records")
      .select("snapshot_tanggal")
      .order("snapshot_tanggal", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (snapshotError) throw new Error(`Gagal membaca tanggal snapshot: ${snapshotError.message}`);
    snapshotDate = data?.snapshot_tanggal ?? null;
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-600">Cara kerja</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold">Metodologi dan batas data</h1>
      <section className="mt-6 rounded-xl border-2 border-black bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Sumber dan cakupan</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Sumber utama yang direncanakan adalah data kontrak pengadaan OCDS dari publikasi Opentender
          oleh ICW, berlisensi ODbL. Data merupakan snapshot, bukan layanan real-time.
        </p>
        <p className="mt-3 text-sm">
          {recordCount === null
            ? "Basis data belum dikonfigurasi; jumlah catatan dan tanggal snapshot belum tersedia."
            : `${recordCount.toLocaleString("id-ID")} catatan tersedia; tanggal snapshot terbaru: ${snapshotDate ?? "belum diketahui"}.`}
        </p>
      </section>
      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Cara pencocokan</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Nama paket dan penyedia dibandingkan dengan kemiripan trigram, sementara nilai kontrak
          dibandingkan menggunakan selisih relatif. Pencocokan membutuhkan sedikitnya dua dari tiga
          field kunci. Ambang dan bobot mengikuti konfigurasi aplikasi dan harus dievaluasi dengan gold set.
        </p>
      </section>
      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Arti status</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
          <li><strong>Cocok:</strong> field yang dibandingkan memenuhi ambang pencocokan.</li>
          <li><strong>Selisih:</strong> satu field berbeda; perbedaan tidak berarti kesalahan.</li>
          <li><strong>Tidak ditemukan:</strong> catatan pembanding tidak ditemukan pada data yang tersedia.</li>
          <li><strong>Catatan resmi:</strong> hasil pencarian data tanpa papan untuk dibandingkan.</li>
        </ul>
      </section>
      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Label informasi</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
          <li><strong>TERCATAT:</strong> dibaca dari papan yang dikonfirmasi pengguna atau catatan resmi.</li>
          <li><strong>HITUNGAN:</strong> dihitung dari data tercatat menggunakan rumus yang dijelaskan.</li>
          <li><strong>BELUM DIKETAHUI:</strong> tidak tersedia atau tidak dapat disimpulkan.</li>
        </ul>
      </section>
      <section className="mt-5 rounded-xl border border-black/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Batas dan koreksi</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          Isian papan belum diverifikasi tim. Snapshot resmi mungkin belum memuat addendum atau
          perubahan kontrak. Teralur tidak menyatakan ada pelanggaran dan tidak menghitung kemajuan
          fisik proyek. Untuk meminta koreksi, alamat kontak harus tersedia pada konfigurasi publik
          sebelum peluncuran.
        </p>
        <p className="mt-3 text-sm text-neutral-700">
          Atribusi: data OCDS, publikasi Opentender oleh ICW; lisensi Open Data Commons Open Database License (ODbL).
        </p>
      </section>
    </main>
  );
}
