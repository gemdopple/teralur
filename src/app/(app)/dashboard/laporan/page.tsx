import { connection } from "next/server";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/teralur/anim/Stagger";
import { databaseConfigured } from "@/lib/server-api";
import { getSupabaseAdmin } from "@/lib/db";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekDemo } from "@/data/proyek-demo";
import { formatTanggal } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";

// Laporan warga untuk peran Pemerintah (F-14, E.13): jumlah per keadaan dan
// catatan verbatim (hanya untuk tim, tidak pernah tampil di publik). Query
// langsung ke tabel kunjungan bila basis data terhubung; tanpa basis data,
// halaman tetap terbaca dengan keadaan kosong (mode cadangan).

export const instant = false;

const LABEL_KEADAAN: Record<string, string> = {
  aktivitas: "Ada aktivitas pekerjaan",
  tidak_terlihat: "Tidak terlihat aktivitas",
  selesai: "Tampak selesai",
};

type BarisLaporan = {
  id: string;
  keadaan: string;
  catatan: string | null;
  tanggal: string;
  proyek: string;
};

async function ambilLaporan(): Promise<{ baris: BarisLaporan[]; alasanKosong: string }> {
  if (!databaseConfigured()) {
    return {
      baris: [],
      alasanKosong:
        "Basis data belum dikonfigurasi pada lingkungan ini, sehingga laporan warga belum dapat ditampilkan.",
    };
  }
  const hariIni = jakartaToday();
  const namaProyek = new Map(daftarProyekDemo(hariIni).map((p) => [p.kunci, p.nama]));

  const { data, error } = await getSupabaseAdmin()
    .from("kunjungan")
    .select("id, keadaan, catatan, tanggal, kunci_proyek")
    .order("tanggal", { ascending: false })
    .order("id", { ascending: false })
    .limit(100);
  if (error) {
    return { baris: [], alasanKosong: "Laporan belum dapat dimuat dari basis data." };
  }

  const baris = (data ?? []).map((row) => ({
    id: row.id as string,
    keadaan: row.keadaan as string,
    catatan: (row.catatan as string | null) ?? null,
    tanggal: row.tanggal as string,
    proyek:
      namaProyek.get(row.kunci_proyek as string) ??
      `Proyek (${String(row.kunci_proyek).slice(0, 8)}…)`,
  }));
  return { baris, alasanKosong: "Belum ada laporan warga untuk proyek ini." };
}

export default async function HalamanLaporanWarga() {
  await connection();
  const { baris, alasanKosong } = await ambilLaporan();
  const hitungan = baris.reduce<Record<string, number>>((hasil, row) => {
    if (LABEL_KEADAAN[row.keadaan]) hasil[row.keadaan] = (hasil[row.keadaan] ?? 0) + 1;
    return hasil;
  }, {});

  return (
    <>
      <KepalaDasbor
        judul="Laporan warga"
        deskripsi="Kumpulan laporan kunjungan warga (F-14). Catatan lapangan hanya terlihat di sini — tidak pernah tampil di halaman publik."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {baris.length > 0 && (
          <section>
            <StaggerGroup className="grid gap-4 sm:grid-cols-3">
              {Object.entries(LABEL_KEADAAN).map(([kunci, label]) => (
                <StaggerItem key={kunci}>
                  <article className="h-full rounded-lg border border-border bg-card p-5 shadow-sm">
                    <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-foreground">
                      {hitungan[kunci] ?? 0}
                    </p>
                  </article>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>
        )}

        <Reveal>
          <section className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {baris.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">{alasanKosong}</p>
            ) : (
              <ul className="divide-y divide-border">
                {baris.map((laporan) => (
                  <li key={laporan.id} className="flex flex-col gap-1.5 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {LABEL_KEADAAN[laporan.keadaan] ?? laporan.keadaan}
                      </Badge>
                      <span className="text-sm font-medium">{laporan.proyek}</span>
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {formatTanggal(laporan.tanggal.slice(0, 10))}
                      </span>
                    </div>
                    {laporan.catatan && (
                      <p className="text-sm leading-6 text-muted-foreground">
                        &ldquo;{laporan.catatan}&rdquo;
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Reveal>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Laporan berlabel HITUNGAN (jumlah per keadaan), bukan ukuran kemajuan fisik.
        </p>
      </div>
    </>
  );
}
