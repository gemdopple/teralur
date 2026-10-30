import Link from "next/link";
import { KepalaDasbor } from "@/components/teralur/KepalaDasbor";
import { ChipStatusRingkas, type DossierStatus } from "@/components/teralur/ChipStatus";
import { Reveal } from "@/components/teralur/anim/Reveal";
import { KartuProyekDasbor } from "@/components/teralur/KartuProyekDasbor";
import { StaggerGroup, StaggerItem } from "@/components/teralur/anim/Stagger";
import { jakartaToday } from "@/lib/dates";
import { daftarProyekDemo, type ProyekPublik } from "@/data/proyek-demo";
import { daftarProyekNyata } from "@/lib/proyek-nyata";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import { META_ROLE, type AppRole } from "@/lib/roles";
import { identitasSaatIni } from "@/lib/identitas";
import { proyekUntukKontraktor, type ProyekKontraktor } from "@/lib/kontraktor-proyek";
import { kelasTombol } from "@/lib/kelas-tombol";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Add01Icon, NoteIcon, WhiteboardIcon } from "@hugeicons/core-free-icons";

// Ringkasan dasbor per peran (peran dari akun, server-side). Kontraktor hanya
// melihat angka dari proyek yang ditugaskan kepadanya. Pemerintah/admin
// memakai proyek nyata dari basis data bila ada; dataset simulasi statis
// dipakai agar dasbor tetap hidup tanpa basis data.

export const instant = false;

function KartuAngka({ label, nilai, keterangan }: { label: string; nilai: string; keterangan?: string }) {
  return (
    <article className="h-full rounded-lg border border-border bg-card p-5 shadow-sm">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-foreground">{nilai}</p>
      {keterangan && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{keterangan}</p>}
    </article>
  );
}

function angkaUntukPeran(peran: AppRole, proyek: ProyekPublik[]) {
  const cocok = proyek.filter((p) => p.status === "cocok").length;
  const selisih = proyek.filter((p) => p.status === "selisih").length;
  const berjalan = proyek.filter((p) => p.status !== "selisih" && p.masaHari !== null).length;
  const nilai = proyek.reduce((jumlah, p) => jumlah + (p.nilaiKontrak ?? 0), 0);

  if (peran === "kontraktor") {
    return [
      { label: "Proyek ditugaskan", nilai: String(proyek.length), keterangan: "Seluruh penugasan aktif" },
      { label: "Dengan masa berjalan", nilai: String(berjalan), keterangan: "Masa pelaksanaan tercatat" },
      { label: "Perlu klarifikasi", nilai: String(selisih), keterangan: "Status selisih terhadap catatan resmi" },
      { label: "Nilai portofolio", nilai: formatRupiahRingkas(nilai) ?? "—", keterangan: "Total nilai kontrak resmi" },
    ];
  }
  if (peran === "admin") {
    return [
      { label: "Proyek", nilai: String(proyek.length), keterangan: "Seluruh proyek di basis data" },
      { label: "Kecocokan penuh", nilai: String(cocok), keterangan: "Data kunci sama dengan catatan resmi" },
      { label: "Perlu klarifikasi", nilai: String(selisih), keterangan: "Status selisih terhadap catatan resmi" },
      { label: "Nilai dibandingkan", nilai: formatRupiahRingkas(nilai) ?? "—", keterangan: "Total nilai kontrak resmi" },
    ];
  }
  return [
    { label: "Proyek terpantau", nilai: String(proyek.length), keterangan: "Seluruh wilayah kerja" },
    { label: "Kecocokan penuh", nilai: String(cocok), keterangan: "Data kunci sama dengan catatan resmi" },
    { label: "Perlu klarifikasi", nilai: String(selisih), keterangan: "Selisih nama, penyedia, atau nilai" },
    { label: "Nilai dibandingkan", nilai: formatRupiahRingkas(nilai) ?? "—", keterangan: "Total nilai kontrak resmi" },
  ];
}

// Angka ringkasan dari proyek yang ditugaskan (peran kontraktor).
function angkaKontraktor(rows: ProyekKontraktor[]) {
  const selisih = rows.filter((r) => r.status === "selisih").length;
  return [
    { label: "Proyek ditugaskan", nilai: String(rows.length), keterangan: "Seluruh penugasan kepada Anda" },
    { label: "Papan QR siap", nilai: String(rows.length), keterangan: "Terlihat publik lewat QR papan" },
    { label: "Perlu klarifikasi", nilai: String(selisih), keterangan: "Status selisih terhadap catatan resmi" },
    { label: "Total penugasan", nilai: String(rows.length), keterangan: "Satu kontraktor per proyek" },
  ];
}

// Satu aksi utama per peran di kepala dasbor; kontraktor tidak punya aksi di
// sini karena aksinya (cetak papan) tersedia per baris proyek. Admin membuat
// proyek dari pintu yang sama dengan pemerintah (halaman buat admin).
const AKSI_PERAN: Partial<Record<AppRole, { href: string; label: string; gaya: "default" | "outline"; ikon: typeof ArrowRight01Icon }>> = {
  pemerintah: { href: "/dashboard/proyek/baru", label: "Tugaskan proyek", gaya: "default", ikon: Add01Icon },
  admin: { href: "/dashboard/proyek/buat", label: "Buat proyek", gaya: "outline", ikon: Add01Icon },
};

function BarisProyek({ proyek }: { proyek: ProyekPublik }) {
  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
      <td className="max-w-72 truncate py-4 pr-4 font-medium" title={proyek.nama}>
        {proyek.nama}
      </td>
      <td className="px-4 py-4 text-muted-foreground">{proyek.lokasi}</td>
      <td className="px-4 py-4">
        <ChipStatusRingkas status={proyek.status as DossierStatus} />
      </td>
      <td className="px-4 py-4 text-right font-mono text-sm whitespace-nowrap">
        {formatRupiahRingkas(proyek.nilaiKontrak ?? proyek.nilaiPapan) ?? "—"}
      </td>
      <td className="py-4 pl-4">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={proyek.href}
            aria-label={`Buka laporan ${proyek.nama}`}
            title="Laporan publik"
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={NoteIcon} className="size-4.5" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

export default async function HalamanRingkasanDasbor() {
  const identitas = await identitasSaatIni();
  const peran = identitas.role;
  const today = jakartaToday();
  // Proyek nyata dari basis data bila tersedia; simulasi hanya cadangan agar
  // dasbor tidak kosong tanpa basis data / sebelum proyek pertama dibuat.
  const nyata = await daftarProyekNyata(today);
  const proyek: ProyekPublik[] = nyata.length > 0 ? nyata : daftarProyekDemo(today);
  const terbaru = proyek.slice(0, 5);
  const meta = META_ROLE[peran];
  const aksi = AKSI_PERAN[peran];

  // Kontraktor: ringkasan dan daftar berasal HANYA dari penugasan miliknya.
  const assigned = peran === "kontraktor" ? await proyekUntukKontraktor(identitas.contractorId) : null;
  const kartu = assigned ? angkaKontraktor(assigned) : angkaUntukPeran(peran, proyek);

  return (
    <>
      <KepalaDasbor
        judul={`Dasbor ${meta.label}`}
        deskripsi={`Selamat datang. ${meta.deskripsi}`}
        aksi={
          aksi ? (
            <Link href={aksi.href} className={kelasTombol(aksi.gaya)}>
              <HugeiconsIcon icon={aksi.ikon} data-icon="inline-start" />
              {aksi.label}
            </Link>
          ) : undefined
        }
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section aria-label="Angka ringkasan">
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kartu.map((item) => (
              <StaggerItem key={item.label}>
                <KartuAngka {...item} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        <Reveal className="mt-4">
          <article className="overflow-hidden rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                {peran === "kontraktor" ? "Penugasan Anda" : "Proyek terbaru"}
              </h2>
              <Link
                href="/dashboard/proyek"
                className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
              >
                Semua proyek
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
              </Link>
            </div>

            {peran === "kontraktor" ? (
              assigned && assigned.length > 0 ? (
                <>
                  <ul className="mt-3 grid gap-3 md:hidden">
                    {assigned.map((row) => (
                      <li
                        key={row.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-4"
                      >
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-snug">{row.title}</p>
                          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{row.slug}</p>
                        </div>
                        <Link href={row.papanHref} className="shrink-0 text-sm font-semibold underline underline-offset-4">
                          Papan
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[36rem] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-3 pr-4 text-xs font-medium text-muted-foreground">Nama paket</th>
                        <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="py-3 pl-4 text-right text-xs font-medium text-muted-foreground">Papan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assigned.map((row) => (
                        <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="max-w-72 truncate py-4 pr-4 font-medium" title={row.title}>
                            {row.title}
                          </td>
                          <td className="px-4 py-4">
                            <ChipStatusRingkas status={row.status as DossierStatus} />
                          </td>
                          <td className="py-4 pl-4 text-right">
                            <Link
                              href={row.papanHref}
                              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="Papan informasi (siap cetak)"
                            >
                              <HugeiconsIcon icon={WhiteboardIcon} className="size-4.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {!identitas.contractorId
                    ? "Akun ini belum tertaut ke data kontraktor. Hubungi pengelola situs."
                    : "Belum ada proyek yang ditugaskan kepada Anda."}
                </p>
              )
            ) : (
              <>
                {/* Ponsel: kartu; layar lebar: tabel (permintaan PM aksesibilitas). */}
                <ul className="mt-3 grid gap-3 md:hidden">
                  {terbaru.map((proyek) => (
                    <KartuProyekDasbor key={proyek.kunci} proyek={proyek} />
                  ))}
                </ul>
                <div className="mt-3 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[36rem] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="py-3 pr-4 text-xs font-medium text-muted-foreground">Nama paket</th>
                        <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Lokasi</th>
                        <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Nilai</th>
                        <th className="py-3 pl-4 text-right text-xs font-medium text-muted-foreground">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terbaru.map((proyek) => (
                        <BarisProyek key={proyek.kunci} proyek={proyek} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </article>
        </Reveal>
      </div>
    </>
  );
}
