import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { kelasTombol } from "@/lib/kelas-tombol";
import { storedBoardSchema } from "@/lib/api-contract";
import { getSupabaseAdmin } from "@/lib/db";
import { dossierUrl, qrSvg } from "@/lib/qr";
import { identitasSaatIni } from "@/lib/identitas";
import { TombolCetak as CetakButton } from "@/components/teralur/TombolCetak";

// Lembar cetak QR (T-46, Lampiran K.2). Sebelumnya di konsol admin
// (/admin/projects/[id]/qr); kini di dasbor, sama seperti halaman proyek lain,
// dan hanya untuk admin. Cetak memakai CSS sendiri: chrome dasbor disembunyikan
// saat @media print.

export const metadata: Metadata = { title: "Lembar QR | Dasbor Teralur" };
export const instant = false;

type BarisProyek = {
  slug: string;
  demo: boolean;
  dinonaktifkan: boolean;
  papan: unknown;
  records: { nama_paket: string } | { nama_paket: string }[] | null;
};

// CSS cetak: A4 portrait margin 12mm (K.2). Saat mencetak, sembunyikan chrome
// dasbor dan semua tombol (.no-print), QR tepat 12 cm × 12 cm, latar putih.
const PRINT_CSS = `
@page { size: A4 portrait; margin: 12mm; }
@media print {
  .no-print, header, aside { display: none !important; }
  body { background: #ffffff !important; }
  .qr-wrap { width: 12cm !important; height: 12cm !important; margin: 8mm auto !important; }
}
`;

export default async function LembarQrPage({ params }: { params: Promise<{ kunci: string }> }) {
  await connection();
  const { kunci } = await params;
  const { role: peran } = await identitasSaatIni();

  if (peran !== "admin") redirect("/dashboard/proyek");

  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .select("slug, demo, dinonaktifkan, papan, records(nama_paket)")
    .eq("id", kunci)
    .eq("jenis", "admin")
    .maybeSingle();
  if (error) throw new Error(`Project lookup failed: ${error.message}`);
  if (!data || data.dinonaktifkan) notFound();
  const row = data as BarisProyek;

  const papan = storedBoardSchema.safeParse(row.papan);
  const records = Array.isArray(row.records) ? row.records[0] : row.records;
  const packageName = papan.success ? (papan.data.nama_paket ?? "") : (records?.nama_paket ?? "");
  let alamat: string | null = null;
  let svg: string | null = null;
  try {
    alamat = await dossierUrl(row.slug);
    svg = await qrSvg(row.slug);
  } catch {
    svg = null; // Alamat situs tak tersedia -> tampilkan pemberitahuan.
  }

  return (
    <>
      <div className="no-print">
        <KepalaDasbor
          judul="Lembar QR"
          deskripsi="Lembar A4 siap cetak dengan kode QR menuju halaman publik proyek."
        />
      </div>
      <main className="print-sheet mx-auto w-full max-w-xl px-4 py-8">
        <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
        <div className="mb-6 flex items-center justify-between">
          <span className="font-heading text-xl font-extrabold tracking-tight">teralur</span>
          <Link
            href={`/dashboard/proyek/${kunci}/kelola#qr`}
            className={`${kelasTombol("outline")} no-print`}
          >
            Kembali
          </Link>
        </div>

        <h1 className="line-clamp-3 text-center font-heading text-2xl font-extrabold leading-snug">
          {packageName}
        </h1>

        {svg ? (
          <div
            className="qr-wrap mx-auto my-6 aspect-square w-[70%] [&_svg]:h-full [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
            aria-label={`Kode QR menuju ${alamat ?? ""}`}
          />
        ) : (
          <p className="my-6 text-center font-semibold text-red-700">Alamat situs belum diatur</p>
        )}

        <p className="text-center text-base font-semibold">Pindai untuk info lengkap proyek</p>
        <p className="mt-2 break-all text-center font-mono text-[14pt]">{alamat}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <CetakButton />
          <Link
            href={`/api/admin/projects/${kunci}/qr?format=svg&download=1`}
            className={`${kelasTombol("outline")} no-print`}
          >
            Unduh SVG
          </Link>
          <Link
            href={`/api/admin/projects/${kunci}/qr?format=png&download=1`}
            className={`${kelasTombol("outline")} no-print`}
          >
            Unduh PNG
          </Link>
        </div>
      </main>
    </>
  );
}