import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { TombolCetak } from "@/components/teralur/TombolCetak";
import { kelasTombol } from "@/lib/kelas-tombol";
import { basisSitus, qrSvgDari } from "@/lib/qr";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekDemo } from "@/data/proyek-demo";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import { identitasSaatIni } from "@/lib/identitas";
import { proyekKontraktor } from "@/lib/kontraktor-proyek";
import { parseStoredBoard } from "@/lib/admin-projects";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";

// Lembar papan informasi proyek (alur kontraktor): pratinjau papan siap cetak
// dengan QR yang dibuat otomatis mengarah ke dossier/example publik proyek.
//
// Dua sumber data:
// - Segmen [kunci] berupa UUID = proyek nyata di basis data. Kontraktor HANYA
//   boleh membuka papan proyek miliknya (penugasan diverifikasi di server).
//   Pemerintah/admin boleh membuka papan proyek admin mana pun.
// - Segmen [kunci] berupa kunci demo (mis. "demo-001") = dataset simulasi
//   publik; hanya untuk pemerintah/admin (bukan penugasan kontraktor).

export const metadata: Metadata = { title: "Papan proyek | Dasbor Teralur" };
export const instant = false;

const PRINT_CSS = `
@page { size: A4 landscape; margin: 10mm; }
@media print {
  body { background: #ffffff !important; }
  .no-print { display: none !important; }
  .papan-halaman { max-width: none !important; padding: 0 !important; }
  .papan {
    box-shadow: none !important;
    min-height: 185mm;
    display: flex;
    flex-direction: column;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .papan-isi { flex: 1 1 auto; align-content: stretch; }
  .papan-qr-kotak { width: 38mm !important; height: 38mm !important; }
}
`;

function Bidang({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-hitam-aspal/60">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm font-semibold leading-snug">{nilai}</dd>
    </div>
  );
}

// Bentuk seragam untuk papan, dari proyek basis data maupun demo.
type PapanData = {
  nama: string;
  instansi: string;
  kategori: string;
  tahun: number;
  penyedia: string | null;
  nilaiKontrak: number | null;
  masaHari: number | null;
  sumberDana: string;
  nomorKontrak: string;
  lokasi: string;
  /** Tujuan QR: dossier publik proyek. */
  href: string;
};

const ID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dariDemo(kunci: string): PapanData | null {
  const proyek = daftarProyekDemo(jakartaToday()).find((p) => p.kunci === kunci);
  if (!proyek) return null;
  return {
    nama: proyek.nama,
    instansi: proyek.instansi,
    kategori: proyek.kategori,
    tahun: proyek.tahun,
    penyedia: proyek.penyedia,
    nilaiKontrak: proyek.nilaiKontrak,
    masaHari: proyek.masaHari,
    sumberDana: proyek.sumberDana,
    nomorKontrak: proyek.nomorKontrak,
    lokasi: proyek.lokasi,
    href: proyek.href,
  };
}

async function dariBasisData(id: string): Promise<PapanData | null> {
  if (!databaseConfigured()) return null;
  const { data: submission } = await getSupabaseAdmin()
    .from("submissions")
    .select("id, slug, papan, dinonaktifkan, records!record_id(nama_paket, penyedia, nilai_kontrak, tanggal_kontrak, masa_hari, tahun, satuan_kerja, wilayah, mentah)")
    .eq("id", id)
    .eq("jenis", "admin")
    .maybeSingle();
  if (!submission || submission.dinonaktifkan) return null;

  const record = Array.isArray(submission.records) ? submission.records[0] : submission.records;
  const papan = parseStoredBoard(submission.papan);
  const mentah = (record?.mentah ?? {}) as Record<string, unknown>;
  const nama = papan?.packageName ?? record?.nama_paket ?? "(tanpa judul)";
  const tahun =
    record?.tahun ?? (record?.tanggal_kontrak ? Number(String(record.tanggal_kontrak).slice(0, 4)) : null);

  return {
    nama,
    instansi:
      papan?.agencyUnit ?? record?.satuan_kerja ?? "Dinas Pekerjaan Umum Kota Tirtamulya",
    kategori: "Proyek",
    tahun: tahun ?? new Date().getFullYear(),
    penyedia: papan?.supplier ?? record?.penyedia ?? null,
    nilaiKontrak: papan?.contractValue ?? (record ? Number(record.nilai_kontrak) : null),
    masaHari: papan?.durationDays ?? record?.masa_hari ?? null,
    sumberDana: papan?.fundingSource ?? (typeof mentah.fundingSource === "string" ? mentah.fundingSource : "APBD"),
    nomorKontrak: papan?.contractNumber ?? (typeof mentah.contractNumber === "string" ? mentah.contractNumber : "—"),
    lokasi: papan?.locationText ?? record?.wilayah ?? "—",
    // QR selalu menuju dossier publik proyek.
    href: `/dossiers/${submission.slug}`,
  };
}

export default async function HalamanPapanProyek({
  params,
}: {
  params: Promise<{ kunci: string }>;
}) {
  await connection();
  const { kunci } = await params;
  const identitas = await identitasSaatIni();

  let proyek: PapanData | null;
  if (ID_UUID.test(kunci)) {
    if (identitas.role === "kontraktor") {
      // Penugasan diverifikasi: kontraktor hanya membuka papan miliknya.
      const milik = await proyekKontraktor(identitas.contractorId, kunci);
      proyek = milik ? await dariBasisData(milik.id) : null;
    } else {
      // Pemerintah dan admin boleh membuka papan proyek admin mana pun.
      proyek = await dariBasisData(kunci);
    }
  } else {
    // Kunci demo bukan penugasan; kontraktor tidak memakainya.
    proyek = identitas.role === "kontraktor" ? null : dariDemo(kunci);
  }
  if (!proyek) notFound();

  // Basis URL: NEXT_PUBLIC_SITE_URL bila diatur; bila kosong, turunkan dari
  // host permintaan agar QR tetap terbentuk di pratinjau lokal.
  const basis = await basisSitus().catch(() => "");
  const tujuan = basis ? `${basis}${proyek.href}` : null;

  let svg: string | null = null;
  try {
    svg = tujuan ? await qrSvgDari(tujuan) : null;
  } catch {
    svg = null;
  }

  const masa = proyek.masaHari !== null ? `${proyek.masaHari} hari kalender` : "—";

  return (
    <>
      <div className="no-print">
        <KepalaDasbor
          judul="Papan proyek"
          deskripsi="Pratinjau papan informasi yang akan dipasang di lokasi. QR dibuat otomatis menuju halaman publik proyek dan dipasang di sudut kanan bawah."
        />
      </div>
      <main className="papan-halaman mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

        <div className="no-print mb-5 flex items-center justify-end gap-2">
          <Link href="/dashboard/proyek" className={kelasTombol("outline")}>
            Kembali
          </Link>
          <TombolCetak label="Cetak papan" />
        </div>

        <section
          aria-label={`Papan informasi proyek ${proyek.nama}`}
          className="papan rounded-md border-2 border-hitam-aspal bg-white text-hitam-aspal shadow-sm"
        >
          <header className="flex items-start justify-between gap-4 rounded-t-md border-b-2 border-hitam-aspal bg-kuning-papan px-5 py-4 sm:px-7">
            <div className="min-w-0">
              <p className="font-heading text-lg font-extrabold uppercase leading-tight sm:text-xl">
                Papan informasi proyek
              </p>
              <p className="mt-1 font-heading text-lg font-extrabold uppercase leading-tight sm:text-xl">
                {proyek.instansi}
              </p>
            </div>
            <span className="shrink-0 rounded-md bg-hitam-aspal px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-kuning-papan">
              {proyek.kategori} · {proyek.tahun}
            </span>
          </header>

          <div className="papan-isi grid gap-6 px-5 py-5 sm:grid-cols-[1fr_auto] sm:px-7">
            <div className="min-w-0 sm:self-center">
              <h2 className="font-heading text-xl font-extrabold leading-snug sm:text-2xl">
                {proyek.nama}
              </h2>
              <dl className="mt-4 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
                <Bidang label="Penyedia pelaksana" nilai={proyek.penyedia ?? "—"} />
                <Bidang label="Nilai kontrak" nilai={formatRupiahRingkas(proyek.nilaiKontrak) ?? "—"} />
                <Bidang label="Jangka waktu" nilai={masa} />
                <Bidang label="Sumber dana" nilai={proyek.sumberDana} />
                <Bidang label="Nomor kontrak" nilai={proyek.nomorKontrak} />
                <Bidang label="Lokasi" nilai={proyek.lokasi} />
              </dl>
            </div>

            {/* QR otomatis, dipasang di sudut kanan bawah papan. */}
            <figure className="sm:justify-self-end sm:self-end">
              {svg ? (
                <div
                  className="papan-qr-kotak size-28 border-2 border-hitam-aspal bg-white p-1.5 [&_svg]:h-full [&_svg]:w-full sm:size-32"
                  dangerouslySetInnerHTML={{ __html: svg }}
                  aria-label={`Kode QR menuju ${tujuan}`}
                />
              ) : (
                <div className="papan-qr-kotak flex size-28 items-center justify-center border-2 border-dashed border-hitam-aspal/40 p-2 text-center text-[10px] font-semibold sm:size-32">
                  QR belum dapat dibuat
                </div>
              )}
              <figcaption className="mt-1.5 max-w-32 text-center text-[10px] font-bold uppercase tracking-wide">
                Pindai untuk pantauan publik
              </figcaption>
            </figure>
          </div>
        </section>
      </main>
    </>
  );
}
