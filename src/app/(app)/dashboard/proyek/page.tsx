import Link from "next/link";
import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { DaftarProyekDasbor, type BarisProyek } from "@/components/teralur/DaftarProyekDasbor";
import { KotakInfo } from "@/components/teralur/KotakInfo";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { parseStoredBoard } from "@/lib/admin-projects";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";
import { identitasSaatIni } from "@/lib/identitas";
import { proyekUntukKontraktor } from "@/lib/kontraktor-proyek";
import type { AppRole } from "@/lib/roles";
import { kelasTombol } from "@/lib/kelas-tombol";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";

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
// Saring, urut, dan sembunyikan baris ditangani komponen klien
// DaftarProyekDasbor; halaman ini hanya mengambil data.

export const instant = false;

const DESKRIPSI_PERAN: Record<AppRole, string> = {
  pemerintah:
    "Tugaskan proyek baru, tetapkan kontraktornya, lalu kelola daftar tersimpan: ubah datanya atau hapus bila salah.",
  kontraktor:
    "Proyek yang ditugaskan kepada Anda — akses baca saja. Buka Papan untuk membuat papan informasi ber-QR yang siap cetak.",
  admin:
    "Seluruh proyek wilayah kerja. Sama seperti pemerintah dan kontraktor, ditambah resource, lembar QR, dan moderasi laporan warga.",
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
      <KepalaDasbor judul="Proyek" deskripsi={DESKRIPSI_PERAN[peran]} />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {!databaseConfigured() ? (
          <Reveal>
            <KotakInfo>Basis data belum dikonfigurasi. Hubungkan Supabase untuk melihat proyek.</KotakInfo>
          </Reveal>
        ) : rows.length === 0 ? (
          <Reveal>
            <KotakInfo tengah>
              <p>{pesanKosong}</p>
              {bisaBuat && (
                <Link href={hrefBuat} className={`${kelasTombol()} mt-4`}>
                  <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
                  {peran === "admin" ? "Buat proyek" : "Tugaskan proyek"}
                </Link>
              )}
            </KotakInfo>
          </Reveal>
        ) : (
          <Reveal>
            {peran === "admin" && (
              <p className="mb-3 text-xs leading-5 text-muted-foreground">
                Aksi utama tampil langsung (papan dan laporan publik); ubah, resource, lembar QR,
                hapus, dan sembunyikan baris ada di menu ⋯. Kolom aksi tetap terlihat saat tabel
                digulir menyamping.
              </p>
            )}
            <DaftarProyekDasbor
              baris={rows}
              peran={peran}
              aksi={
                bisaBuat ? (
                  <Link href={hrefBuat} className={kelasTombol()}>
                    <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
                    {peran === "admin" ? "Buat proyek" : "Tugaskan proyek"}
                  </Link>
                ) : undefined
              }
            />
          </Reveal>
        )}
      </div>
    </>
  );
}
