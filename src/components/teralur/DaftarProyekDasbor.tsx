"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  EyeOffIcon,
  MoreHorizontalIcon,
  NoteIcon,
  PencilEdit01Icon,
  QrCodeIcon,
  SearchIcon,
  SourceCodeIcon,
  WhiteboardIcon,
} from "@hugeicons/core-free-icons";
import { Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
import { ChipStatusRingkas, type DossierStatus } from "@/components/teralur/ChipStatus";
import { DialogHapusProyek } from "@/components/teralur/TombolHapusProyek";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatWib } from "@/lib/dates";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import type { AppRole } from "@/lib/roles";

// Daftar proyek dasbor (klien): saring, urutkan, sembunyikan baris satu-satu,
// dan kolom aksi yang menempel saat tabel digulir menyamping. Aksi baris
// dibatasi dua tombol teratas (Papan, Laporan publik); sisanya ada di menu "…".

export type BarisProyek = {
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

const STATUS_CHIP: Record<string, DossierStatus | undefined> = {
  cocok: "cocok",
  selisih: "selisih",
  tidak_ditemukan: "tidak_ditemukan",
  catatan_resmi: "catatan_resmi",
};

type PilihanStatus = "semua" | Exclude<DossierStatus, undefined>;

type Urutan = "terbaru" | "terlama" | "nilai-turun" | "nilai-naik" | "judul";

const URUTAN: Record<Urutan, string> = {
  terbaru: "Terbaru diperbarui",
  terlama: "Terlama diperbarui",
  "nilai-turun": "Nilai tertinggi",
  "nilai-naik": "Nilai terendah",
  judul: "Judul A–Z",
};

function bandingUrutan(urutan: Urutan) {
  switch (urutan) {
    case "terlama":
      return (a: BarisProyek, b: BarisProyek) => a.diperbarui.localeCompare(b.diperbarui);
    case "nilai-turun":
      return (a: BarisProyek, b: BarisProyek) => (b.nilai ?? -Infinity) - (a.nilai ?? -Infinity);
    case "nilai-naik":
      return (a: BarisProyek, b: BarisProyek) =>
        (a.nilai ?? Infinity) - (b.nilai ?? Infinity) || a.judul.localeCompare(b.judul, "id");
    case "judul":
      return (a: BarisProyek, b: BarisProyek) => a.judul.localeCompare(b.judul, "id");
    default:
      return (a: BarisProyek, b: BarisProyek) => b.diperbarui.localeCompare(a.diperbarui);
  }
}

// ---------- Aksi per baris ----------

const IKON_AKSI =
  "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const KELAS_MENU_ITEM =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none data-focused:bg-accent data-focused:text-accent-foreground";

const KELAS_MENU_ITEM_HAPUS =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive outline-none data-focused:bg-destructive/10 data-focused:text-destructive";

function AksiBaris({
  baris,
  peran,
  saatSembunyikan,
  saatHapus,
}: {
  baris: BarisProyek;
  peran: AppRole;
  saatSembunyikan: (id: string) => void;
  saatHapus: (baris: BarisProyek) => void;
}) {
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
      <MenuTrigger>
        {/* Harus Button dari ui/button (react-aria): pemicu MenuTrigger
            menempel lewat context yang hanya dikonsumsi komponen RAC. */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Aksi lainnya untuk ${judul}`}
          className="rounded-full text-muted-foreground"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4.5" />
        </Button>
        <Popover
          placement="bottom end"
          offset={4}
          className="w-52 origin-(--trigger-anchor-point) overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg ring-1 ring-foreground/5 entering:animate-in entering:fade-in-0 entering:zoom-in-95"
        >
          <Menu className="outline-none">
            {bisaUbah && (
              <MenuItem href={hrefUbah} className={KELAS_MENU_ITEM}>
                <HugeiconsIcon icon={PencilEdit01Icon} className="size-4 text-muted-foreground" />
                Ubah proyek
              </MenuItem>
            )}
            {peran === "admin" && (
              <MenuItem href={`/dashboard/proyek/${baris.id}/kelola#resource`} className={KELAS_MENU_ITEM}>
                <HugeiconsIcon icon={SourceCodeIcon} className="size-4 text-muted-foreground" />
                Resource
              </MenuItem>
            )}
            {peran === "admin" && (
              <MenuItem href={`/dashboard/proyek/${baris.id}/kelola#qr`} className={KELAS_MENU_ITEM}>
                <HugeiconsIcon icon={QrCodeIcon} className="size-4 text-muted-foreground" />
                Lembar QR
              </MenuItem>
            )}
            <MenuItem
              onAction={() => saatSembunyikan(baris.id)}
              className={KELAS_MENU_ITEM}
              aria-label={`Sembunyikan baris ${judul}`}
            >
              <HugeiconsIcon icon={EyeOffIcon} className="size-4 text-muted-foreground" />
              Sembunyikan baris
            </MenuItem>
            {bisaUbah && (
              <MenuItem onAction={() => saatHapus(baris)} className={KELAS_MENU_ITEM_HAPUS}>
                Hapus proyek
              </MenuItem>
            )}
          </Menu>
        </Popover>
      </MenuTrigger>
    </div>
  );
}

const KOLOM_AKSI_STICKY = "sticky right-0 z-10 bg-card border-l border-border";

function Baris({
  baris,
  peran,
  saatSembunyikan,
  saatHapus,
}: {
  baris: BarisProyek;
  peran: AppRole;
  saatSembunyikan: (id: string) => void;
  saatHapus: (baris: BarisProyek) => void;
}) {
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
      <td className={`py-4 pl-3 ${KOLOM_AKSI_STICKY}`}>
        <AksiBaris baris={baris} peran={peran} saatSembunyikan={saatSembunyikan} saatHapus={saatHapus} />
      </td>
    </tr>
  );
}

// Ponsel: kartu ringkas — tabel sembilan kolom tidak terbaca di layar sempit.
function Kartu({
  baris,
  peran,
  saatSembunyikan,
  saatHapus,
}: {
  baris: BarisProyek;
  peran: AppRole;
  saatSembunyikan: (id: string) => void;
  saatHapus: (baris: BarisProyek) => void;
}) {
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
        <AksiBaris baris={baris} peran={peran} saatSembunyikan={saatSembunyikan} saatHapus={saatHapus} />
      </div>
    </li>
  );
}

export function DaftarProyekDasbor({
  baris,
  peran,
  aksi,
}: {
  baris: BarisProyek[];
  peran: AppRole;
  /** Aksi utama (mis. Buat proyek) — tampil di ujung bilah saring. */
  aksi?: ReactNode;
}) {
  const [kueri, setKueri] = useState("");
  const [status, setStatus] = useState<PilihanStatus>("semua");
  const [urutan, setUrutan] = useState<Urutan>("terbaru");
  const [tersembunyi, setTersembunyi] = useState<Set<string>>(new Set());
  const [hapusTarget, setHapusTarget] = useState<BarisProyek | null>(null);

  const terlihat = useMemo(() => {
    const q = kueri.trim().toLowerCase();
    const cocok = baris.filter(
      (b) =>
        !tersembunyi.has(b.id) &&
        (status === "semua" || STATUS_CHIP[b.status ?? ""] === status) &&
        (!q ||
          [b.judul, b.slug, b.penyedia ?? "", b.kontraktor ?? ""].some((teks) =>
            teks.toLowerCase().includes(q),
          )),
    );
    return cocok.sort(bandingUrutan(urutan));
  }, [baris, kueri, status, urutan, tersembunyi]);

  function sembunyikan(id: string) {
    setTersembunyi((nilai) => new Set(nilai).add(id));
  }

  const tersaring = kueri.trim() !== "" || status !== "semua";

  return (
    <div>
      {/* Saring dan urutkan — berlaku untuk tabel dan kartu ponsel. */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <InputGroup className="w-full sm:w-64">
          <InputGroupInput
            type="search"
            placeholder="Cari judul, penyedia, kontraktor…"
            aria-label="Cari proyek"
            value={kueri}
            onChange={(e) => setKueri(e.target.value)}
          />
          <InputGroupAddon>
            <HugeiconsIcon icon={SearchIcon} className="size-4 shrink-0 opacity-50" />
          </InputGroupAddon>
        </InputGroup>
        <Select
          selectedKey={status}
          onSelectionChange={(kunci) => setStatus(kunci as PilihanStatus)}
        >
          <SelectTrigger aria-label="Saring status" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem id="semua">Semua status</SelectItem>
            <SelectItem id="cocok">Cocok</SelectItem>
            <SelectItem id="selisih">Selisih</SelectItem>
            <SelectItem id="tidak_ditemukan">Tidak ditemukan</SelectItem>
            <SelectItem id="catatan_resmi">Catatan resmi</SelectItem>
          </SelectContent>
        </Select>
        <Select
          selectedKey={urutan}
          onSelectionChange={(kunci) => setUrutan(kunci as Urutan)}
        >
          <SelectTrigger aria-label="Urutkan" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(URUTAN) as Urutan[]).map((kunci) => (
              <SelectItem key={kunci} id={kunci}>
                {URUTAN[kunci]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {aksi && <div className="ms-auto">{aksi}</div>}
      </div>

      {tersembunyi.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm">
          <p className="text-muted-foreground">
            {tersembunyi.size} baris disembunyikan — masih ada di dasbor, hanya disingkirkan dari
            daftar ini.
          </p>
          <button
            type="button"
            onClick={() => setTersembunyi(new Set())}
            className="font-semibold underline underline-offset-4 hover:text-foreground"
          >
            Tampilkan semua
          </button>
        </div>
      )}

      {terlihat.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground shadow-sm">
          {baris.length === 0
            ? null
            : tersaring
              ? "Tidak ada proyek yang cocok dengan pencarian atau saringan."
              : "Semua baris disembunyikan. Tampilkan semua untuk melihatnya lagi."}
          {(tersaring || tersembunyi.size > 0) && baris.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setKueri("");
                setStatus("semua");
                setTersembunyi(new Set());
              }}
              className="ms-2 font-semibold text-foreground underline underline-offset-4"
            >
              Atur ulang
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
          {/* Ponsel: kartu; layar lebar: tabel. */}
          <ul className="grid gap-3 md:hidden">
            {terlihat.map((b) => (
              <Kartu
                key={b.id}
                baris={b}
                peran={peran}
                saatSembunyikan={sembunyikan}
                saatHapus={setHapusTarget}
              />
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
                  <th className={`py-3 pl-3 text-right text-xs font-medium text-muted-foreground ${KOLOM_AKSI_STICKY}`}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {terlihat.map((b) => (
                  <Baris
                    key={b.id}
                    baris={b}
                    peran={peran}
                    saatSembunyikan={sembunyikan}
                    saatHapus={setHapusTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hapusTarget && (
        <DialogHapusProyek
          projectId={hapusTarget.id}
          nama={hapusTarget.judul}
          terbuka
          saatTertutup={() => setHapusTarget(null)}
        />
      )}
    </div>
  );
}
