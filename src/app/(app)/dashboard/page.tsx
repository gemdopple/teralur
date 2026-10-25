import Link from "next/link";
import { cookies } from "next/headers";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { StaggerGroup, StaggerItem } from "@/components/teralur/anim/Stagger";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekDemo, type ProyekDemo } from "@/data/proyek-demo";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import { peranDariNilai, META_ROLE, ROLE_COOKIE, type AppRole } from "@/lib/roles";
import { kelasTombol } from "@/lib/kelas-tombol";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, MapIcon, FileValidationIcon, NoteIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

// Ringkasan dasbor per peran (redesign v2). Data memakai dataset simulasi
// statis sehingga dasbor tetap hidup tanpa basis data (mode cadangan); status
// selalu dihitung compare() produksi saat render.

export const instant = false;

function KartuAngka({ label, nilai, keterangan }: { label: string; nilai: string; keterangan?: string }) {
  return (
    <article className="h-full rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-foreground">{nilai}</p>
      {keterangan && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{keterangan}</p>}
    </article>
  );
}

function angkaUntukPeran(peran: AppRole, proyek: ProyekDemo[]) {
  const terbit = proyek.filter((p) => p.terbit);
  const cocok = terbit.filter((p) => p.status === "cocok").length;
  const selisih = terbit.filter((p) => p.status === "selisih").length;
  const berjalan = terbit.filter((p) => p.status !== "selisih" && p.masaHari !== null).length;
  const nilai = terbit.reduce((jumlah, p) => jumlah + (p.nilaiKontrak ?? 0), 0);
  const draf = proyek.length - terbit.length;

  if (peran === "kontraktor") {
    return [
      { label: "Portofolio proyek", nilai: String(terbit.length), keterangan: "Seluruh proyek aktif dalam portofolio" },
      { label: "Dengan masa berjalan", nilai: String(berjalan), keterangan: "Masa pelaksanaan tercatat" },
      { label: "Perlu klarifikasi", nilai: String(selisih), keterangan: "Status selisih terhadap catatan resmi" },
      { label: "Nilai portofolio", nilai: formatRupiahRingkas(nilai) ?? "—", keterangan: "Total nilai kontrak resmi" },
    ];
  }
  if (peran === "admin") {
    return [
      { label: "Proyek terbit", nilai: String(terbit.length), keterangan: "Terlihat publik" },
      { label: "Draf", nilai: String(draf), keterangan: "Belum diterbitkan" },
      { label: "Perlu klarifikasi", nilai: String(selisih), keterangan: "Status selisih terhadap catatan resmi" },
      { label: "Nilai dibandingkan", nilai: formatRupiahRingkas(nilai) ?? "—", keterangan: "Total nilai kontrak resmi" },
    ];
  }
  return [
    { label: "Proyek terpantau", nilai: String(terbit.length), keterangan: "Seluruh wilayah kerja" },
    { label: "Kecocokan penuh", nilai: String(cocok), keterangan: "Data kunci sama dengan catatan resmi" },
    { label: "Perlu klarifikasi", nilai: String(selisih), keterangan: "Selisih nama, penyedia, atau nilai" },
    { label: "Nilai dibandingkan", nilai: formatRupiahRingkas(nilai) ?? "—", keterangan: "Total nilai kontrak resmi" },
  ];
}

const PANEL_PERAN: Record<AppRole, { judul: string; isi: string; tautan: Array<{ href: string; label: string; ikon: typeof MapIcon }> }> = {
  pemerintah: {
    judul: "Fokus peran Pemerintah",
    isi: "Pantau seluruh proyek daerah, periksa daftar selisih yang perlu klarifikasi, dan baca laporan warga sebagai pemeriksaan kedua dari lapangan.",
    tautan: [
      { href: "/dashboard/peta", label: "Buka peta proyek", ikon: MapIcon },
      { href: "/dashboard/laporan", label: "Baca laporan warga", ikon: NoteIcon },
    ],
  },
  kontraktor: {
    judul: "Fokus peran Kontraktor",
    isi: "Lihat masa pelaksanaan setiap penugasan, pastikan data papan lengkap, dan bandingkan nilai kontrak dengan catatan resmi sebelum auditor menemukannya.",
    tautan: [
      { href: "/dashboard/proyek", label: "Lihat daftar proyek", ikon: FileValidationIcon },
      { href: "/dashboard/peta", label: "Buka peta proyek", ikon: MapIcon },
    ],
  },
  admin: {
    judul: "Fokus peran Admin",
    isi: "Konsol admin menangani seluruh perubahan isi: membuat proyek, mengunggah resource, menerbitkan dossier, mencetak QR, dan moderasi laporan warga.",
    tautan: [
      { href: "/admin", label: "Buka konsol admin", ikon: FileValidationIcon },
      { href: "/dashboard/pengaturan", label: "Pengaturan situs", ikon: MapIcon },
    ],
  },
};

function BarisProyek({ proyek }: { proyek: ProyekDemo }) {
  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
      <td className="max-w-72 truncate py-3.5 pr-3 font-medium" title={proyek.nama}>
        {proyek.nama}
      </td>
      <td className="px-3 py-3.5 text-muted-foreground">{proyek.lokasi}</td>
      <td className="px-3 py-3.5">
        <ChipStatus status={proyek.status as DossierStatus} />
      </td>
      <td className="px-3 py-3.5 text-right font-mono text-sm whitespace-nowrap">
        {formatRupiahRingkas(proyek.nilaiKontrak) ?? "—"}
      </td>
      <td className="py-3.5 pl-3 text-right">
        <Link
          href={proyek.href}
          className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Laporan
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
        </Link>
      </td>
    </tr>
  );
}

export default async function HalamanRingkasanDasbor() {
  const cookieStore = await cookies();
  const peran = peranDariNilai(cookieStore.get(ROLE_COOKIE)?.value);
  const hariIni = jakartaToday();
  const proyek = daftarProyekDemo(hariIni);
  const terbit = proyek.filter((p) => p.terbit);
  const terbaru = [...terbit].slice(0, 5);
  const meta = META_ROLE[peran];
  const panel = PANEL_PERAN[peran];

  return (
    <>
      <KepalaDasbor
        judul={`Dasbor ${meta.label}`}
        deskripsi={`Selamat datang. ${meta.deskripsi}`}
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section aria-label="Angka ringkasan">
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {angkaUntukPeran(peran, proyek).map((kartu) => (
              <StaggerItem key={kartu.label}>
                <KartuAngka {...kartu} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <article className="h-full overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-semibold tracking-tight">Proyek terbaru</h2>
                <Link
                  href="/dashboard/proyek"
                  className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Semua proyek
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                </Link>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2.5 pr-3 text-xs font-medium text-muted-foreground">Nama paket</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Lokasi</th>
                      <th className="px-3 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Nilai</th>
                      <th className="py-2.5 pl-3 text-right text-xs font-medium text-muted-foreground">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terbaru.map((proyek) => (
                      <BarisProyek key={proyek.kunci} proyek={proyek} />
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.08}>
            <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="font-heading text-lg font-semibold tracking-tight">{panel.judul}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{panel.isi}</p>
              <div className="mt-auto grid gap-2 pt-5">
                {panel.tautan.map((tautan) => (
                  <Link
                    key={tautan.href}
                    href={tautan.href}
                    className={cn(kelasTombol("outline"), "justify-start")}
                  >
                    <HugeiconsIcon icon={tautan.ikon} data-icon="inline-start" />
                    {tautan.label}
                  </Link>
                ))}
              </div>
            </article>
          </Reveal>
        </section>

        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          Status pada setiap proyek dihitung ulang otomatis oleh sistem perbandingan setiap
          halaman dibuka.
        </p>
      </div>
    </>
  );
}
