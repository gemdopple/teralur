import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { buttonVariants } from "@/components/ui/button";
import { storedBoardSchema } from "@/lib/api-contract";
import { getSupabaseAdmin } from "@/lib/db";
import { qrSvg } from "@/lib/qr";
import { CetakButton } from "./cetak-button";

// Lembar cetak QR (T-46, Lampiran K.2). Berada DI DALAM route group
// (dashboard) sehingga penjaga sesi di layout grup berlaku; URL tetap
// /admin/projects/[id]/qr. Komponen server: QR di-embed langsung sebagai SVG
// dari lib/qr (bukan <img> yang fetch ulang endpoint).

export const metadata: Metadata = { title: "Lembar QR | Admin Teralur" };
export const instant = false;

type BarisProyek = {
  slug: string;
  demo: boolean;
  dinonaktifkan: boolean;
  papan: unknown;
  records: { nama_paket: string } | { nama_paket: string }[] | null;
};

// CSS cetak: A4 portrait margin 12mm (K.2). Saat mencetak: sembunyikan chrome
// admin (kepala halaman berkelas bg-kuning-papan milik layout grup) dan semua
// tombol (.no-print), QR tepat 12 cm × 12 cm, latar putih.
const PRINT_CSS = `
@page { size: A4 portrait; margin: 12mm; }
@media print {
  .bg-kuning-papan { display: none !important; }
  .no-print { display: none !important; }
  body { background: #ffffff !important; }
  .qr-wrap { width: 12cm !important; height: 12cm !important; margin: 8mm auto !important; }
}
`;

export default async function LembarQrPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;

  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .select("slug, demo, dinonaktifkan, papan, records(nama_paket)")
    .eq("id", id)
    .eq("jenis", "admin")
    .maybeSingle();
  if (error) throw new Error(`Project lookup failed: ${error.message}`);
  if (!data || data.dinonaktifkan) notFound();
  const row = data as BarisProyek;

  const papan = storedBoardSchema.safeParse(row.papan);
  const records = Array.isArray(row.records) ? row.records[0] : row.records;
  const packageName = papan.success ? (papan.data.nama_paket ?? "") : (records?.nama_paket ?? "");
  const dossierUrl = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/dossiers/${row.slug}`;

  let svg: string | null = null;
  try {
    svg = await qrSvg(row.slug);
  } catch {
    svg = null; // NEXT_PUBLIC_SITE_URL belum diatur -> tampilkan pemberitahuan.
  }

  return (
    <main className="print-sheet mx-auto w-full max-w-xl px-4 py-8">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="mb-6 flex items-center justify-between">
        <span className="font-heading text-xl font-extrabold tracking-tight">teralur</span>
        <Link href={`/admin/projects/${id}`} className={`${buttonVariants({ variant: "outline" })} no-print`}>
          Kembali
        </Link>
      </div>

      {row.demo && (
        <div className="mx-auto mb-6 w-fit border-4 border-black px-8 py-2 font-heading text-3xl font-extrabold tracking-widest">
          SIMULASI
        </div>
      )}

      <h1 className="line-clamp-3 text-center font-heading text-2xl font-extrabold leading-snug">
        {packageName}
      </h1>

      {svg ? (
        <div
          className="qr-wrap mx-auto my-6 aspect-square w-[70%] [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
          aria-label={`Kode QR menuju ${dossierUrl}`}
        />
      ) : (
        <p className="my-6 text-center font-semibold text-red-700">Alamat situs belum diatur</p>
      )}

      <p className="text-center text-base font-semibold">Pindai untuk info lengkap proyek</p>
      <p className="mt-2 break-all text-center font-mono text-[14pt]">{dossierUrl}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <CetakButton />
        <Link href={`/api/admin/projects/${id}/qr?format=svg&download=1`} className={`${buttonVariants({ variant: "outline" })} no-print`}>
          Unduh SVG
        </Link>
        <Link href={`/api/admin/projects/${id}/qr?format=png&download=1`} className={`${buttonVariants({ variant: "outline" })} no-print`}>
          Unduh PNG
        </Link>
      </div>
    </main>
  );
}
