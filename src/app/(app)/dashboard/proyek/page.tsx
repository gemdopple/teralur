import Link from "next/link";
import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { ChipStatusRingkas, type DossierStatus } from "@/components/teralur/ChipStatus";
import { TombolHapusProyek } from "@/components/teralur/TombolHapusProyek";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { formatWib } from "@/lib/dates";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import { parseStoredBoard } from "@/lib/admin-projects";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";
import { identitasSaatIni } from "@/lib/identitas";
import { proyekUntukKontraktor } from "@/lib/kontraktor-proyek";
import type { AppRole } from "@/lib/roles";
import { kelasTombol } from "@/lib/kelas-tombol";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  NoteIcon,
  PencilEdit01Icon,
  QrCodeIcon,
  SourceCodeIcon,
  WhiteboardIcon,
} from "@hugeicons/core-free-icons";

// Daftar proyek dasbor — SATU tabel untuk semua peran.
//
// Konsol admin sudah dihapus: admin tidak lagi punya daftar terpisah. Di sini
// admin melihat daftar yang sama dengan pemerintah, ditambah kolom kontraktor
// dan resource, plus aksi khusus admin. Kemampuan admin adalah gabungan ketiga
// peran:
//   - pemerintah: tugaskan/buat proyek, ubah, hapus;
//   - kontraktor : papan QR, buka laporan publik;
//   - admin      : resource, lembar QR cetak, moderasi laporan warga.
// Kontraktor tetap HANYA melihat proyek yang ditugaskan kepadanya — saringan
// itu ditegakkan di server lewat contractor_id, bukan di tampilan.

export const instant = false;

const DESKRIPSI_PERAN: Record<AppRole, string> = {
  pemerintah:
    "Tugaskan proyek baru, tetapkan kontraktornya, lalu kelola daftar tersimpan: ubah datanya atau hapus bila salah.",
  kontraktor:
    "Proyek yang ditugaskan kepada Anda — akses baca saja. Buka Papan untuk membuat papan informasi ber-QR yang siap cetak.",
  admin:
    "Seluruh proyek wilayah kerja. Sama seperti pemerintah dan kontraktor, ditambah resource, lembar QR, dan moderasi laporan warga.",
};

const STATUS_CHIP: Record<string, DossierStatus | undefined> = {
  cocok: "cocok",
  selisih: "selisih",
  tidak_ditemukan: "tidak_ditemukan",
  catatan_resmi: "catatan_resmi",
};

// ---------- Baris seragam ----------
//
// Satu bentuk untuk semua peran; kolom yang tidak relevan dibiarkan null
// sehingga tabel tidak bercabang di JSX.

type BarisProyek = {
  id: string;
  slug: string;
  judul: string;
  status: string | null;
  unggulan: boolean;
  diperbarui: string;
  /** Nilai kontrak; null untuk proyek yang belum punya catatan resmi. */
  nilai: number | null;
  penyedia: string | null;
  /** Nama kontraktor pelaksana (disaring per peran). */
  kontraktor: string | null;
  jumlahResource: number;
};

// PostgREST mengembalikan objek untuk embed many-to-one; tipe supabase-js
// tanpa skema menyimpulkan array — terima keduanya.
type EmbedSatu<T> = T | T[] | null;

type BarisDb = {
  id: string;
  slug: string;
  status: string | null;
  unggulan: boolean;
  diperbarui: string;
  papan: unknown;
  contractor_id: string | null;
  records: EmbedSatu<{
    nama_paket: string;
    penyedia: string | null;
    nilai_kontrak: number | string | null;
  }>;
  resources: { count: number }[] | null;
  contractors: EmbedSatu<{ nama: string }>;
};

function satu<T>(value: EmbedSatu<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function judulDari(row: BarisDb): string {
  const papan = parseStoredBoard(row.papan);
  if (papan?.packageName) return papan.packageName;
  return satu(row.records)?.nama_paket ?? "(tanpa judul)";
}

function dariBarisDb(row: BarisDb): BarisProyek {
  const record = satu(row.records);
  const nilai = record?.nilai_kontrak ?? null;
  return {
    id: row.id,
    slug: row.slug,
    judul: judulDari(row),
    status: row.status,
    unggulan: row.unggulan,
    diperbarui: row.diperbarui,
    nilai: nilai === null ? null : Number(nilai),
    penyedia: record?.penyedia ?? null,
    kontraktor: satu(row.contractors)?.nama ?? null,
    jumlahResource: row.resources?.reduce((total, item) => total + item.count, 0) ?? 0,
  };
}

const KOLOM_DB =
  "id, slug, status, unggulan, diperbarui, papan, contractor_id, records!record_id(nama_paket, penyedia, nilai_kontrak), resources(count), contractors!contractor_id(nama)";

// ---------- Aksi per baris ----------

const IKON_AKSI =
  "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

function AksiBaris({ baris, peran }: { baris: BarisProyek; peran: AppRole }) {
  const bisaUbah = peran !== "kontraktor";
  const judul = baris.judul;
  const hrefUbah =
    peran === "admin" ? `/dashboard/proyek/${baris.id}/kelola` : `/dashboard/proyek/${baris.id}/ubah`;
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/dashboard/proyek/${baris.id}/papan`}
        aria-label={`Papan informasi ${judul}`}
        title="Papan informasi (siap cetak)"
        className={IKON_AKSI}
      >
        <HugeiconsIcon icon={WhiteboardIcon} className="size-4.5" />
      </Link>
      <Link
        href={`/dossiers/${baris.slug}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`Buka laporan publik ${judul}`}
        title="Laporan publik"
        className={IKON_AKSI}
      >
        <HugeiconsIcon icon={NoteIcon} className="size-4.5" />
      </Link>
      {bisaUbah && (
        <Link
          href={hrefUbah}
          aria-label={`Ubah proyek ${judul}`}
          title="Ubah proyek"
          className={IKON_AKSI}
        >
          <HugeiconsIcon icon={PencilEdit01Icon} className="size-4.5" />
        </Link>
      )}
      {peran === "admin" && (
        <>
          <Link
            href={`/dashboard/proyek/${baris.id}/kelola#resource`}
            aria-label={`Resource proyek ${judul}`}
            title="Resource proyek"
            className={IKON_AKSI}
          >
            <HugeiconsIcon icon={SourceCodeIcon} className="size-4.5" />
          </Link>
          <Link
            href={`/dashboard/proyek/${baris.id}/kelola#qr`}
            aria-label={`QR proyek ${judul}`}
            title="Lembar QR"
            className={IKON_AKSI}
          >
            <HugeiconsIcon icon={QrCodeIcon} className="size-4.5" />
          </Link>
        </>
      )}
      {bisaUbah && <TombolHapusProyek projectId={baris.id} nama={judul} />}
    </div>
  );
}

function Baris({ baris, peran }: { baris: BarisProyek; peran: AppRole }) {
  const chip = STATUS_CHIP[baris.status ?? ""];
  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
      <td className="py-4 pr-3" title={baris.judul}>
        <span className="flex items-center gap-1.5">
          <span className="truncate font-medium">{baris.judul}</span>
          {baris.unggulan && (
            <span className="shrink-0 text-xs" aria-label="Unggulan" title="Unggulan">
              ★
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
          {baris.slug}
        </span>
      </td>
      <td className="px-3 py-4">
        {chip ? (
          <ChipStatusRingkas status={chip} />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className="hidden px-3 py-4 text-sm text-muted-foreground lg:table-cell">
        {baris.kontraktor ?? "—"}
      </td>
      <td className="hidden px-3 py-4 text-sm text-muted-foreground xl:table-cell">
        {baris.penyedia ?? "—"}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-right font-mono text-sm">
        {formatRupiahRingkas(baris.nilai) ?? "—"}
      </td>
      <td className="hidden px-3 py-4 text-right font-mono text-sm tabular-nums md:table-cell">
        {peran === "admin" ? baris.jumlahResource : "—"}
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
        {formatWib(baris.diperbarui)}
      </td>
      <td className="py-4 pl-3">
        <AksiBaris baris={baris} peran={peran} />
      </td>
    </tr>
  );
}

// Ponsel: kartu ringkas — tabel sembilan kolom tidak terbaca di layar sempit.
function Kartu({ baris, peran }: { baris: BarisProyek; peran: AppRole }) {
  const chip = STATUS_CHIP[baris.status ?? ""];
  return (
    <li className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug tracking-tight">
            {baris.judul}
          </h3>
          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{baris.slug}</p>
        </div>
        {chip && <ChipStatusRingkas status={chip} className="shrink-0" />}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Nilai</dt>
          <dd className="font-mono">{formatRupiahRingkas(baris.nilai) ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Penyedia</dt>
          <dd className="truncate">{baris.penyedia ?? "—"}</dd>
        </div>
        <div className="col-span-2 flex justify-between gap-2">
          <dt className="text-muted-foreground">Kontraktor</dt>
          <dd className="truncate">{baris.kontraktor ?? "—"}</dd>
        </div>
        {peran === "admin" && (
          <div className="col-span-2 flex justify-between gap-2">
            <dt className="text-muted-foreground">Resource</dt>
            <dd className="font-mono tabular-nums">{baris.jumlahResource}</dd>
          </div>
        )}
      </dl>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <p className="text-xs text-muted-foreground">
          Diperbarui {formatWib(baris.diperbarui)}
        </p>
        <AksiBaris baris={baris} peran={peran} />
      </div>
    </li>
  );
}

// ---------- Data ----------

async function daftarProyek(peran: AppRole, contractorId: string | null): Promise<BarisProyek[]> {
  if (!databaseConfigured()) return [];

  // Kontraktor: jalur tersaring. proyekUntukKontraktor mengembalikan daftar
  // kosong bila akun belum tertaut — tidak pernah jatuh ke seluruh proyek.
  if (peran === "kontraktor") {
    const milik = await proyekUntukKontraktor(contractorId);
    if (milik.length === 0) return [];
    const { data, error } = await getSupabaseAdmin()
      .from("submissions")
      .select(KOLOM_DB)
      .eq("jenis", "admin")
      .eq("dinonaktifkan", false)
      .eq("contractor_id", contractorId)
      .order("diperbarui", { ascending: false });
    if (error) throw new Error(`Project list query failed: ${error.message}`);
    return ((data ?? []) as BarisDb[]).map(dariBarisDb);
  }

  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .select(KOLOM_DB)
    .eq("jenis", "admin")
    .eq("dinonaktifkan", false)
    .order("diperbarui", { ascending: false });
  if (error) throw new Error(`Project list query failed: ${error.message}`);
  return ((data ?? []) as BarisDb[]).map(dariBarisDb);
}

export default async function HalamanProyekDasbor() {
  await connection();
  const identitas = await identitasSaatIni();
  const peran = identitas.role;
  const rows = await daftarProyek(peran, identitas.contractorId);

  const bisaBuat = peran !== "kontraktor";
  const hrefBuat = peran === "admin" ? "/dashboard/proyek/buat" : "/dashboard/proyek/baru";
  const pesanKosong =
    peran === "kontraktor"
      ? "Belum ada proyek yang ditugaskan kepada Anda."
      : "Belum ada proyek. Buat proyek pertama.";

  return (
    <>
      <KepalaDasbor
        judul="Proyek"
        deskripsi={DESKRIPSI_PERAN[peran]}
        aksi={
          bisaBuat ? (
            <Link href={hrefBuat} className={kelasTombol()}>
              <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
              {peran === "admin" ? "Buat proyek" : "Tugaskan proyek"}
            </Link>
          ) : undefined
        }
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {!databaseConfigured() ? (
          <Reveal>
            <p className="rounded-lg border border-border bg-card px-4 py-4 text-sm text-muted-foreground shadow-sm">
              Basis data belum dikonfigurasi. Hubungkan Supabase untuk melihat proyek.
            </p>
          </Reveal>
        ) : rows.length === 0 ? (
          <Reveal>
            <p className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground shadow-sm">
              {pesanKosong}
            </p>
          </Reveal>
        ) : (
          <Reveal>
            {peran === "admin" && (
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                Admin punya semua aksi di sini: papan QR dan laporan publik (seperti kontraktor),
                ubah dan hapus (seperti pemerintah), serta resource dan lembar QR. Klik ikon pensil
                untuk halaman kelola lengkap.
              </p>
            )}
            <div className="overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
              {/* Ponsel: kartu; layar lebar: tabel. */}
              <ul className="grid gap-3 md:hidden">
                {rows.map((baris) => (
                  <Kartu key={baris.id} baris={baris} peran={peran} />
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[60rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-3 pr-3 text-xs font-medium text-muted-foreground">Proyek</th>
                      <th className="px-3 py-3 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="hidden px-3 py-3 text-xs font-medium text-muted-foreground lg:table-cell">
                        Kontraktor
                      </th>
                      <th className="hidden px-3 py-3 text-xs font-medium text-muted-foreground xl:table-cell">
                        Penyedia
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground">
                        Nilai
                      </th>
                      <th className="hidden px-3 py-3 text-right text-xs font-medium text-muted-foreground md:table-cell">
                        Resource
                      </th>
                      <th className="px-3 py-3 text-xs font-medium text-muted-foreground">
                        Diperbarui
                      </th>
                      <th className="py-3 pl-3 text-right text-xs font-medium text-muted-foreground">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((baris) => (
                      <Baris key={baris.id} baris={baris} peran={peran} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </>
  );
}