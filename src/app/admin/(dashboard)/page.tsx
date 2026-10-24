import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { storedBoardSchema } from "@/lib/api-contract";
import { getSupabaseAdmin } from "@/lib/db";
import { databaseConfigured } from "@/lib/server-api";

export const metadata: Metadata = { title: "Daftar proyek | Admin Teralur" };

// Daftar proyek admin (Lampiran L.2). Komponen server: query langsung ke DB
// memakai klien service-role (src/lib/db.ts) — jalur yang sama dengan halaman
// dossier. RLS tanpa policy membuat klien ini satu-satunya jalan ke data.
export const instant = false;

// Kolom submissions.status menyimpan nilai internal; ChipStatus memakai nilai
// yang sama (api-contract memetakan ke enum API hanya di batas HTTP).
const STATUS_CHIP: Record<string, DossierStatus | undefined> = {
  cocok: "cocok",
  selisih: "selisih",
  tidak_ditemukan: "tidak_ditemukan",
  catatan_resmi: "catatan_resmi",
};

type BarisProyek = {
  id: string;
  slug: string;
  status: string | null;
  terbit: boolean;
  unggulan: boolean;
  diperbarui: string;
  papan: unknown;
  // PostgREST mengembalikan objek untuk embed many-to-one; tipe supabase-js
  // tanpa skema menyimpulkan array — terima keduanya.
  records: { nama_paket: string } | { nama_paket: string }[] | null;
  resources: { count: number }[] | null;
};

const formatWib = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function judulBaris(row: BarisProyek): string {
  const papan = storedBoardSchema.safeParse(row.papan);
  if (papan.success && papan.data.nama_paket) return papan.data.nama_paket;
  const record = Array.isArray(row.records) ? row.records[0] : row.records;
  return record?.nama_paket ?? "(tanpa judul)";
}

export default async function AdminProjectListPage() {
  // Render dinamis per-permintaan; daftar tidak boleh ter-cache antar sesi.
  await connection();

  if (!databaseConfigured()) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="font-heading text-2xl font-extrabold">Daftar proyek</h1>
        <p className="mt-3 text-neutral-700">
          Basis data belum dikonfigurasi. Hubungkan Supabase untuk mengelola proyek.
        </p>
      </main>
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("submissions")
    .select(
      "id, slug, status, terbit, unggulan, diperbarui, papan, records!record_id(nama_paket), resources(count)",
    )
    .eq("jenis", "admin")
    .eq("dinonaktifkan", false)
    .order("diperbarui", { ascending: false });
  if (error) throw new Error(`Project list query failed: ${error.message}`);
  const rows = (data ?? []) as BarisProyek[];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-extrabold">Daftar proyek</h1>
        <Link href="/admin/projects/new" className={buttonVariants()}>
          Buat proyek
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-md border border-border bg-card px-4 py-6 text-neutral-700">
          Belum ada proyek. Buat proyek pertama.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terbit</TableHead>
                <TableHead>Unggulan</TableHead>
                <TableHead className="text-right">Resource</TableHead>
                <TableHead>Diperbarui</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const chip = STATUS_CHIP[row.status ?? ""];
                const jumlahResource =
                  row.resources?.reduce((total, item) => total + item.count, 0) ?? 0;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-72 font-medium">
                      <Link
                        href={`/admin/projects/${row.id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {judulBaris(row)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {chip ? (
                        <ChipStatus status={chip} />
                      ) : (
                        <span className="text-sm text-neutral-600">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.terbit ? (
                        <Badge>Terbit</Badge>
                      ) : (
                        <Badge variant="outline">Draf</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.unggulan ? <span>★ Unggulan</span> : <span>—</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {jumlahResource}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatWib.format(new Date(row.diperbarui))} WIB
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <Link
                          href={`/admin/projects/${row.id}`}
                          className="underline underline-offset-4"
                        >
                          Ubah
                        </Link>
                        {row.terbit ? (
                          <Link
                            href={`/dossiers/${row.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-4"
                          >
                            Buka dossier
                          </Link>
                        ) : null}
                        <Link
                          href={`/admin/projects/${row.id}/qr`}
                          className="underline underline-offset-4"
                        >
                          QR
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
