"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RentangTanggalPicker,
  TanggalPicker,
  type NilaiRentang,
} from "@/components/ui/date-picker";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PratinjauStatus } from "./PratinjauStatus";
import { toast } from "react-hot-toast";
import { parseNilaiUang } from "@/lib/nilai-uang";
import type { ApiBoard } from "@/lib/api-contract";

// Formulir proyek (Lampiran L.3, T-42) — sengaja ringkas: satu kartu "Data
// papan proyek" berisi semua isian dengan kontrol shadcn (Select untuk
// dropdown, pemilih tanggal/kalender untuk tanggal, rentang untuk masa
// pelaksanaan). Catatan resmi dari registry tidak lagi dipilih di sini —
// tautan yang sudah ada dipertahankan apa adanya saat menyimpan. Lokasi
// tersinkron dengan peta: mengetik memberi saran alamat (Nominatim), memilih
// saran menggerakkan pin; klik peta mengisi alamat otomatis.
// Dipakai di /dashboard/proyek/buat, /dashboard/proyek/[kunci]/kelola, dan
// halaman alur pemerintah (/dashboard/proyek/baru, /[kunci]/ubah).

type FieldKey =
  | "packageName"
  | "supplier"
  | "contractValue"
  | "durationDays"
  | "fiscalYear"
  | "fundingSource"
  | "agencyUnit"
  | "contractNumber"
  | "contractDate"
  | "locationText"
  | "executionStartDate"
  | "executionEndDate"
  | "locationLatitude"
  | "locationLongitude";

type Blok = Record<FieldKey, string>;

type InitialData = {
  id: string;
  slug: string;
  featured: boolean;
  board: ApiBoard;
  officialRecord: ApiBoard | null;
  /** id baris registry yang tertaut (null = belum tertaut). */
  recordId?: string | null;
  /** Kontraktor yang ditugaskan (null/kosong = belum ditugaskan). */
  contractorId?: string | null;
};

/** Baris registry catatan resmi (tertaut dari awal; tidak diubah formulir). */
export type RekamanRegistry = {
  id: string;
  packageName: string;
  supplier: string | null;
  contractValue: number | null;
  contractDate: string | null;
  durationDays: number | null;
  fiscalYear: number | null;
  agencyUnit: string | null;
};

/** Pilihan kontraktor untuk penugasan satu proyek ke satu kontraktor. */
export type OpsiKontraktor = { id: string; nama: string };

type FieldErrors = { board?: Partial<Record<FieldKey, string>> };

// Batas panjang dan aturan per field (Lampiran L.3 / D.1).
const BATAS_PANJANG: Partial<Record<FieldKey, number>> = {
  packageName: 300,
  supplier: 200,
  fundingSource: 200,
  agencyUnit: 200,
  contractNumber: 100,
  locationText: 300,
};

const BLOK_KOSONG: Blok = {
  packageName: "",
  supplier: "",
  contractValue: "",
  durationDays: "",
  executionStartDate: "",
  executionEndDate: "",
  fiscalYear: "",
  fundingSource: "",
  agencyUnit: "",
  contractNumber: "",
  contractDate: "",
  locationText: "",
  locationLatitude: "",
  locationLongitude: "",
};

const PESAN_SESI_HABIS = "Sesi berakhir. Masuk lagi.";
const GALAT_NILAI = "Isi angka rupiah, mis. 1.250.000.000.";
const NILAI_MAKSIMAL = 1_000_000_000_000_000;

// Kelompokkan digit dengan titik ribuan saat diketik ("1485000000" → "1.485.000.000").
function formatAngkaInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatRupiah(nilai: number): string {
  return `Rp ${formatAngkaInput(String(nilai))}`;
}

function angkaAtauKosong(raw: string): number | null {
  const s = raw.trim();
  if (s === "" || !/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

// Templat nomor kontrak: 4 slot bebas, "/", 9 slot bebas, lalu "/," dan 2 slot
// bebas — pemisah terisi otomatis di posisinya ("123456789012345" →
// "1234/567890123/,45"). Karakter pengguna selain pemisah lolos apa adanya,
// jadi nomor bertuliskan huruf (mis. SPK) tetap bisa diisi.
const TEMPLAT_KONTRAK = "..../........./,..";

function terapkanTemplatKontrak(raw: string): string {
  const bebas = raw.replace(/[/,]/g, "");
  let keluaran = "";
  let i = 0;
  for (const ch of TEMPLAT_KONTRAK) {
    if (i >= bebas.length) break;
    if (ch === ".") keluaran += bebas[i++];
    else keluaran += ch;
  }
  return keluaran;
}

function blokDariApi(api: ApiBoard): Blok {
  return {
    packageName: api.packageName ?? "",
    supplier: api.supplier ?? "",
    contractValue:
      typeof api.contractValue === "number" ? formatAngkaInput(String(api.contractValue)) : "",
    durationDays:
      api.durationDays === null || api.durationDays === undefined ? "" : String(api.durationDays),
    executionStartDate: api.executionStartDate ?? "",
    executionEndDate: api.executionEndDate ?? "",
    fiscalYear:
      api.fiscalYear === null || api.fiscalYear === undefined ? "" : String(api.fiscalYear),
    fundingSource: api.fundingSource ?? "",
    agencyUnit: api.agencyUnit ?? "",
    contractNumber: api.contractNumber ?? "",
    contractDate: api.contractDate ?? "",
    locationText: api.locationText ?? "",
    locationLatitude: typeof api.locationLatitude === "number" ? String(api.locationLatitude) : "",
    locationLongitude:
      typeof api.locationLongitude === "number" ? String(api.locationLongitude) : "",
  };
}

function rekamanDariApi(id: string, api: ApiBoard): RekamanRegistry {
  return {
    id,
    packageName: api.packageName ?? "(tanpa nama)",
    supplier: api.supplier,
    contractValue: api.contractValue,
    contractDate: api.contractDate,
    durationDays: api.durationDays,
    fiscalYear: api.fiscalYear,
    agencyUnit: api.agencyUnit,
  };
}

function rekamanKePerbandingan(item: RekamanRegistry): {
  packageName: string | null;
  supplier: string | null;
  contractValue: number | null;
} {
  return {
    packageName: item.packageName,
    supplier: item.supplier,
    contractValue: item.contractValue,
  };
}

type ApiBlok = {
  packageName: string | null;
  supplier: string | null;
  contractValue: number | null;
  durationDays: number | null;
  fiscalYear: number | null;
  fundingSource: string | null;
  agencyUnit: string | null;
  contractNumber: string | null;
  contractDate: string | null;
  locationText: string | null;
  executionStartDate: string | null;
  executionEndDate: string | null;
  locationLatitude: number | null;
  locationLongitude: number | null;
};

// Ubah isi blok menjadi payload API (Lampiran D.1): teks kosong → null,
// nilai kontrak diparse dengan parser D.2, angka divalidasi rentang.
function blokKeApi(blok: Blok): ApiBlok {
  const nilai = parseNilaiUang(blok.contractValue);
  const mulai = blok.executionStartDate || null;
  const selesai = blok.executionEndDate || null;
  const masaHari =
    mulai && selesai
      ? Math.floor(
          (Date.parse(`${selesai}T00:00:00Z`) - Date.parse(`${mulai}T00:00:00Z`)) / 86_400_000,
        ) + 1
      : angkaAtauKosong(blok.durationDays);
  return {
    packageName: blok.packageName.trim() || null,
    supplier: blok.supplier.trim() || null,
    contractValue: nilai,
    durationDays: masaHari,
    fiscalYear: angkaAtauKosong(blok.fiscalYear),
    fundingSource: blok.fundingSource.trim() || null,
    agencyUnit: blok.agencyUnit.trim() || null,
    contractNumber: blok.contractNumber.trim() || null,
    contractDate: blok.contractDate.trim() || null,
    locationText: blok.locationText.trim() || null,
    executionStartDate: mulai,
    executionEndDate: selesai,
    locationLatitude: blok.locationLatitude.trim() ? Number(blok.locationLatitude) : null,
    locationLongitude: blok.locationLongitude.trim() ? Number(blok.locationLongitude) : null,
  };
}

// BoardLike untuk compare() (Lampiran F.3) dari isi blok.
function blokKePerbandingan(blok: Blok): {
  packageName: string | null;
  supplier: string | null;
  contractValue: number | null;
} {
  const api = blokKeApi(blok);
  return {
    packageName: api.packageName,
    supplier: api.supplier,
    contractValue: api.contractValue,
  };
}

function tanggalValid(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

// Validasi klien per field (L.3): wajib hanya nama paket. Rentang angka;
// tanggal TTTT-BB-HH.
function validasiBlok(blok: Blok): Partial<Record<FieldKey, string>> {
  const galat: Partial<Record<FieldKey, string>> = {};

  const nama = blok.packageName.trim();
  if (nama === "") galat.packageName = "Nama paket wajib diisi.";
  else if (nama.length > BATAS_PANJANG.packageName!)
    galat.packageName = "Nama paket maksimal 300 karakter.";

  const penyedia = blok.supplier.trim();
  if (penyedia.length > BATAS_PANJANG.supplier!) galat.supplier = "Penyedia maksimal 200 karakter.";

  const nilaiTeks = blok.contractValue.trim();
  if (nilaiTeks !== "") {
    const nilai = parseNilaiUang(nilaiTeks);
    if (nilai === null) galat.contractValue = GALAT_NILAI;
    else if (nilai > NILAI_MAKSIMAL) galat.contractValue = "Nilai kontrak melebihi batas maksimal.";
  }

  const mulai = blok.executionStartDate.trim();
  const selesai = blok.executionEndDate.trim();
  if ((mulai && !selesai) || (!mulai && selesai)) {
    galat.executionStartDate = "Isi tanggal mulai dan selesai.";
    galat.executionEndDate = "Isi tanggal mulai dan selesai.";
  } else if (mulai && selesai) {
    if (!tanggalValid(mulai)) galat.executionStartDate = "Tanggal mulai tidak valid.";
    if (!tanggalValid(selesai)) galat.executionEndDate = "Tanggal selesai tidak valid.";
    if (tanggalValid(mulai) && tanggalValid(selesai)) {
      const hari =
        Math.floor(
          (Date.parse(`${selesai}T00:00:00Z`) - Date.parse(`${mulai}T00:00:00Z`)) / 86_400_000,
        ) + 1;
      if (hari < 1) galat.executionEndDate = "Tanggal selesai harus setelah tanggal mulai.";
      else if (hari > 3650) galat.executionEndDate = "Masa pelaksanaan maksimal 3650 hari.";
    }
  }

  const tahun = angkaAtauKosong(blok.fiscalYear);
  if (blok.fiscalYear.trim() !== "") {
    if (tahun === null || tahun < 2000 || tahun > 2100)
      galat.fiscalYear = "Tahun anggaran harus angka 2000–2100.";
  }

  if (blok.fundingSource.trim().length > BATAS_PANJANG.fundingSource!)
    galat.fundingSource = "Sumber dana maksimal 200 karakter.";
  if (blok.agencyUnit.trim().length > BATAS_PANJANG.agencyUnit!)
    galat.agencyUnit = "Satuan kerja maksimal 200 karakter.";
  if (blok.contractNumber.trim().length > BATAS_PANJANG.contractNumber!)
    galat.contractNumber = "Nomor kontrak maksimal 100 karakter.";
  if (blok.locationText.trim().length > BATAS_PANJANG.locationText!)
    galat.locationText = "Lokasi maksimal 300 karakter.";

  const tanggal = blok.contractDate.trim();
  if (tanggal !== "" && !tanggalValid(tanggal))
    galat.contractDate = "Tanggal tidak valid (harus TTTT-BB-HH).";

  const latitude = blok.locationLatitude.trim();
  const longitude = blok.locationLongitude.trim();
  if (Boolean(latitude) !== Boolean(longitude)) {
    galat.locationLatitude = "Pilih titik lokasi pada peta.";
    galat.locationLongitude = "Pilih titik lokasi pada peta.";
  } else if (latitude && longitude) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
      galat.locationLatitude = "Latitude harus antara -90 dan 90.";
    if (!Number.isFinite(lng) || lng < -180 || lng > 180)
      galat.locationLongitude = "Longitude harus antara -180 dan 180.";
  }

  return galat;
}

type ResponsGalat = {
  code?: string;
  message?: string;
  details?: { path: (string | number)[]; message: string }[];
};

async function bacaGalat(res: Response): Promise<ResponsGalat> {
  try {
    return (await res.json()) as ResponsGalat;
  } catch {
    return {};
  }
}

function Kolom({
  idFor,
  label,
  required,
  galat,
  hint,
  className,
  children,
}: {
  idFor: string;
  label: string;
  required?: boolean;
  galat?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={idFor}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
        {required ? <span className="sr-only">(wajib)</span> : null}
      </Label>
      {children}
      {hint && !galat ? (
        <p className="text-xs text-neutral-600" id={`${idFor}-ket`}>
          {hint}
        </p>
      ) : null}
      {galat ? (
        <p className="text-xs font-medium text-destructive" id={`${idFor}-galat`}>
          {galat}
        </p>
      ) : null}
    </div>
  );
}

// Saran alamat dari Nominatim (OpenStreetMap — sumber ubin peta yang sama).
type HasilLokasi = { label: string; lat: number; lng: number };

function KolomLokasi({
  blok,
  galat,
  tampilkanGalat,
  onChange,
}: {
  blok: Blok;
  galat: Partial<Record<FieldKey, string>>;
  tampilkanGalat: boolean;
  onChange: (key: FieldKey, value: string) => void;
}) {
  const id = "board-locationText";
  const err = tampilkanGalat ? galat.locationText : undefined;
  const [hasil, setHasil] = useState<HasilLokasi[]>([]);
  const [mencari, setMencari] = useState(false);
  const [fokus, setFokus] = useState(false);
  // Label saran yang baru dipilih: mencegah efek pencarian mengisi ulang daftar
  // untuk teks yang sama. Mencari lagi begitu teksnya diubah pengguna. Panel
  // hanya tampil saat kolom difokuskan — teks dari peta tidak memunculkannya.
  const [baruDipilih, setBaruDipilih] = useState<string | null>(null);
  const layakCari =
    fokus &&
    blok.locationText.trim().length >= 3 &&
    blok.locationText !== baruDipilih;

  // Saran alamat dengan jeda ketik 400 ms (sopan terhadap Nominatim, maks 1
  // permintaan/detik). Semua setState ada di callback asinkron, bukan badan efek.
  useEffect(() => {
    if (!layakCari) return;
    const q = blok.locationText.trim();
    const kendali = new AbortController();
    const timer = setTimeout(() => {
      setMencari(true);
      fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=id&q=${encodeURIComponent(q)}`,
        { signal: kendali.signal },
      )
        .then(async (res) => (res.ok ? res.json() : []))
        .then(
          (
            data: {
              display_name: string;
              lat: string;
              lon: string;
            }[],
          ) => {
            const daftar = Array.isArray(data)
              ? data.map((d) => ({
                  label: d.display_name,
                  lat: Number(d.lat),
                  lng: Number(d.lon),
                }))
              : [];
            setHasil(daftar);
          },
        )
        .catch(() => {})
        .finally(() => setMencari(false));
    }, 400);
    return () => {
      clearTimeout(timer);
      kendali.abort();
    };
  }, [layakCari, blok.locationText]);

  function pilih(item: HasilLokasi) {
    const label = item.label.slice(0, BATAS_PANJANG.locationText!);
    onChange("locationText", label);
    onChange("locationLatitude", String(Number(item.lat.toFixed(6))));
    onChange("locationLongitude", String(Number(item.lng.toFixed(6))));
    setBaruDipilih(label);
  }

  return (
    <Kolom
      idFor={id}
      label="Lokasi"
      galat={err}
      className="relative space-y-1.5"
      hint="Ketik alamat lalu pilih sarannya untuk memindahkan pin peta."
    >
      <Input
        id={id}
        value={blok.locationText}
        placeholder="Contoh: Jl. Merdeka, Desa Sukamaju, Kab. Tangerang"
        maxLength={BATAS_PANJANG.locationText}
        autoComplete="off"
        onChange={(e) => onChange("locationText", e.target.value)}
        onFocus={() => setFokus(true)}
        onBlur={() => setFokus(false)}
        aria-invalid={err ? true : undefined}
      />
      {layakCari && (hasil.length > 0 || mencari) ? (
        <div
          role="listbox"
          aria-label="Saran alamat"
          // Panel & butir memakai kelas yang sama dengan popover ui/select.
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/5"
          // preventDefault: klik saran tidak melepas fokus input dulu.
          onMouseDown={(e) => e.preventDefault()}
        >
          {mencari && hasil.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Mencari alamat…</p>
          ) : null}
          {hasil.map((item) => (
            <button
              key={`${item.lat},${item.lng}`}
              type="button"
              role="option"
              aria-selected={blok.locationText === item.label}
              className="relative flex w-full cursor-default items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium outline-none hover:bg-accent focus-visible:bg-accent"
              onClick={() => pilih(item)}
            >
              <span className="line-clamp-2">{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </Kolom>
  );
}

const PetaLokasiProyek = dynamic(() => import("./PetaLokasiProyek"), {
  ssr: false,
  loading: () => (
    <div className="grid h-64 place-items-center rounded-lg border border-border bg-muted text-sm text-muted-foreground">
      Memuat peta…
    </div>
  ),
});

function BlokFormulir({
  blok,
  galat,
  tampilkanGalat,
  onChange,
  kontraktor,
  satuanKerja,
  kontraktorId,
  saatPilihKontraktor,
}: {
  blok: Blok;
  galat: Partial<Record<FieldKey, string>>;
  tampilkanGalat: boolean;
  onChange: (key: FieldKey, value: string) => void;
  kontraktor: OpsiKontraktor[];
  satuanKerja: string[];
  kontraktorId: string;
  saatPilihKontraktor: (id: string) => void;
}) {
  const nilaiTerbaca = parseNilaiUang(blok.contractValue);
  const [supplierManual, setSupplierManual] = useState(
    () => blok.supplier !== "" && !kontraktor.some((item) => item.nama === blok.supplier),
  );
  const [satuanManual, setSatuanManual] = useState(
    () => blok.agencyUnit !== "" && !satuanKerja.includes(blok.agencyUnit),
  );
  const latitude = blok.locationLatitude ? Number(blok.locationLatitude) : null;
  const longitude = blok.locationLongitude ? Number(blok.locationLongitude) : null;

  const rentang: NilaiRentang = {
    mulai: blok.executionStartDate || null,
    selesai: blok.executionEndDate || null,
  };
  const masaHari =
    rentang.mulai && rentang.selesai && tanggalValid(rentang.mulai) && tanggalValid(rentang.selesai)
      ? Math.floor(
          (Date.parse(`${rentang.selesai}T00:00:00Z`) -
            Date.parse(`${rentang.mulai}T00:00:00Z`)) /
            86_400_000,
        ) + 1
      : null;
  const galatRentang =
    (tampilkanGalat ? galat.executionStartDate : undefined) ??
    (tampilkanGalat ? galat.executionEndDate : undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data papan proyek</CardTitle>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          Isi berdasarkan papan proyek. Nama paket wajib; data lain dapat dilengkapi bertahap.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <Kolom
            idFor="board-packageName"
            label="Nama paket"
            required
            galat={tampilkanGalat ? galat.packageName : undefined}
            className="sm:col-span-2"
          >
            <Input
              id="board-packageName"
              value={blok.packageName}
              placeholder="Contoh: Rehabilitasi Jalan Desa Sukamaju"
              maxLength={BATAS_PANJANG.packageName}
              onChange={(e) => onChange("packageName", e.target.value)}
              aria-invalid={tampilkanGalat && galat.packageName ? true : undefined}
            />
          </Kolom>

          <Kolom
            idFor="board-supplier"
            label="Penyedia (perusahaan)"
            galat={tampilkanGalat ? galat.supplier : undefined}
            hint="Pilih kontraktor terdaftar atau isi nama penyedia lain."
          >
            <Select
              id="board-supplier"
              className="w-full"
              selectedKey={supplierManual ? "__manual__" : blok.supplier || null}
              onSelectionChange={(kunci) => {
                const manual = kunci === "__manual__";
                setSupplierManual(manual);
                onChange("supplier", manual ? "" : String(kunci));
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {() =>
                    supplierManual ? "Nama lain…" : blok.supplier || "Pilih penyedia…"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {kontraktor.map((item) => (
                  <SelectItem key={item.id} id={item.nama}>
                    {item.nama}
                  </SelectItem>
                ))}
                <SelectItem id="__manual__">Nama lain…</SelectItem>
              </SelectContent>
            </Select>
            {supplierManual ? (
              <Input
                id="board-supplier-manual"
                className="mt-1.5"
                value={blok.supplier}
                maxLength={BATAS_PANJANG.supplier}
                placeholder="Ketik nama perusahaan penyedia"
                onChange={(e) => onChange("supplier", e.target.value)}
                aria-label="Nama penyedia lain"
              />
            ) : null}
          </Kolom>

          <Kolom
            idFor="board-contractValue"
            label="Nilai kontrak (Rp)"
            galat={tampilkanGalat ? galat.contractValue : undefined}
            hint={nilaiTerbaca !== null ? formatRupiah(nilaiTerbaca) : undefined}
          >
            <Input
              id="board-contractValue"
              inputMode="numeric"
              value={blok.contractValue}
              placeholder="Contoh: 1.250.000.000"
              onChange={(e) => onChange("contractValue", formatAngkaInput(e.target.value))}
              aria-invalid={tampilkanGalat && galat.contractValue ? true : undefined}
            />
          </Kolom>

          <Kolom
            idFor="board-fiscalYear"
            label="Tahun anggaran"
            galat={tampilkanGalat ? galat.fiscalYear : undefined}
            hint="Masukkan tahun saja (2000–2100)."
          >
            <Input
              id="board-fiscalYear"
              inputMode="numeric"
              value={blok.fiscalYear}
              placeholder="Contoh: 2026"
              onChange={(e) => onChange("fiscalYear", formatAngkaInput(e.target.value))}
              aria-invalid={tampilkanGalat && galat.fiscalYear ? true : undefined}
            />
          </Kolom>

          <Kolom
            idFor="board-fundingSource"
            label="Sumber dana"
            galat={tampilkanGalat ? galat.fundingSource : undefined}
          >
            <Input
              id="board-fundingSource"
              value={blok.fundingSource}
              placeholder="Contoh: APBD / DAK"
              maxLength={BATAS_PANJANG.fundingSource}
              onChange={(e) => onChange("fundingSource", e.target.value)}
              aria-invalid={tampilkanGalat && galat.fundingSource ? true : undefined}
            />
          </Kolom>

          <Kolom
            idFor="board-agencyUnit"
            label="Satuan kerja"
            galat={tampilkanGalat ? galat.agencyUnit : undefined}
            hint={
              satuanKerja.length > 0
                ? "Pilih dari akun Pemerintah yang terdaftar atau masukkan satuan kerja lain."
                : "Belum ada pilihan akun Pemerintah. Pilih “Satuan kerja lain…” untuk mengisi manual."
            }
          >
            <Select
              id="board-agencyUnit"
              className="w-full"
              selectedKey={satuanManual ? "__manual__" : blok.agencyUnit || null}
              onSelectionChange={(kunci) => {
                const manual = kunci === "__manual__";
                setSatuanManual(manual);
                onChange("agencyUnit", manual ? "" : String(kunci));
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {() =>
                    satuanManual
                      ? "Satuan kerja lain…"
                      : blok.agencyUnit || "Pilih satuan kerja…"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {satuanKerja.map((nama) => (
                  <SelectItem key={nama} id={nama}>
                    {nama}
                  </SelectItem>
                ))}
                <SelectItem id="__manual__">Satuan kerja lain…</SelectItem>
              </SelectContent>
            </Select>
            {satuanManual ? (
              <Input
                id="board-agencyUnit-manual"
                className="mt-1.5"
                value={blok.agencyUnit}
                maxLength={BATAS_PANJANG.agencyUnit}
                placeholder="Ketik nama satuan kerja"
                onChange={(e) => onChange("agencyUnit", e.target.value)}
                aria-label="Nama satuan kerja lain"
              />
            ) : null}
          </Kolom>

          <Kolom
            idFor="board-contractNumber"
            label="Nomor kontrak"
            galat={tampilkanGalat ? galat.contractNumber : undefined}
            hint="Format: 0001/000000000/,00 — garis miring dan koma terisi otomatis."
          >
            <Input
              id="board-contractNumber"
              value={blok.contractNumber}
              placeholder="0001/000000000/,00"
              onChange={(e) => onChange("contractNumber", terapkanTemplatKontrak(e.target.value))}
              aria-invalid={tampilkanGalat && galat.contractNumber ? true : undefined}
            />
          </Kolom>

          <Kolom
            idFor="board-contractDate"
            label="Tanggal kontrak"
            galat={tampilkanGalat ? galat.contractDate : undefined}
            hint="Tanggal penandatanganan kontrak."
          >
            <TanggalPicker
              ariaLabel="Tanggal kontrak"
              value={blok.contractDate || null}
              onChange={(iso) => onChange("contractDate", iso ?? "")}
              isInvalid={Boolean(tampilkanGalat && galat.contractDate)}
            />
          </Kolom>

          <Kolom
            idFor="board-executionStartDate"
            label="Masa pelaksanaan (mulai – selesai)"
            galat={galatRentang}
            hint={
              masaHari !== null
                ? `Masa pelaksanaan: ${masaHari} hari kalender.`
                : "Pilih tanggal mulai dan selesai dalam satu kalender."
            }
            className="sm:col-span-2"
          >
            <RentangTanggalPicker
              ariaLabel="Rentang masa pelaksanaan"
              value={rentang}
              onChange={(nilai) => {
                onChange("executionStartDate", nilai.mulai ?? "");
                onChange("executionEndDate", nilai.selesai ?? "");
              }}
              isInvalid={Boolean(galatRentang)}
            />
          </Kolom>

          <KolomLokasi blok={blok} galat={galat} tampilkanGalat={tampilkanGalat} onChange={onChange} />
        </div>

        <div className="space-y-2">
          <div>
            <Label htmlFor="peta-lokasi-proyek">Titik lokasi proyek</Label>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Klik peta untuk menandai lokasi — alamat terisi otomatis dari titik yang dipilih.
            </p>
          </div>
          <div id="peta-lokasi-proyek" className="overflow-hidden rounded-lg border border-border">
            <PetaLokasiProyek
              latitude={latitude}
              longitude={longitude}
              saatPilih={(lat, lng) => {
                onChange("locationLatitude", String(Number(lat.toFixed(6))));
                onChange("locationLongitude", String(Number(lng.toFixed(6))));
                // Sinkron dua arah: isi alamat dari koordinat yang diklik
                // (Nominatim reverse). Diam saja bila layanan gagal.
                fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=id`,
                )
                  .then(async (res) => (res.ok ? res.json() : null))
                  .then((data: { display_name?: string } | null) => {
                    if (data?.display_name) {
                      onChange("locationText", data.display_name.slice(0, BATAS_PANJANG.locationText!));
                    }
                  })
                  .catch(() => {});
              }}
            />
          </div>
          {latitude !== null && longitude !== null ? (
            <p className="text-xs text-muted-foreground">
              Titik dipilih: {latitude.toFixed(6)}, {longitude.toFixed(6)}{" "}
              <button
                type="button"
                className="underline underline-offset-2"
                onClick={() => {
                  onChange("locationLatitude", "");
                  onChange("locationLongitude", "");
                }}
              >
                Hapus titik
              </button>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada pin lokasi.</p>
          )}
        </div>

        {kontraktor ? (
          <Kolom
            idFor="kontraktor-pelaksana"
            label="Penugasan kontraktor"
            hint={
              kontraktor.length === 0
                ? "Belum ada kontraktor aktif. Buat akun kontraktor terlebih dahulu agar dapat menugaskan proyek."
                : "Kontraktor yang dipilih melihat proyek ini di akunnya dan memperbarui papan lapangan."
            }
          >
            <Select
              id="kontraktor-pelaksana"
              className="w-full max-w-md"
              selectedKey={kontraktorId || "__kosong__"}
              onSelectionChange={(kunci) => saatPilihKontraktor(kunci === "__kosong__" ? "" : String(kunci))}
            >
              <SelectTrigger>
                <SelectValue>
                  {() =>
                    kontraktor.find((item) => item.id === kontraktorId)?.nama ??
                      "— Belum ditugaskan —"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem id="__kosong__">— Belum ditugaskan —</SelectItem>
                {kontraktor.map((item) => (
                  <SelectItem key={item.id} id={item.id}>
                    {item.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Kolom>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function FormProyek({
  mode,
  initial,
  kembaliKe,
  kontraktor,
  satuanKerja,
}: {
  mode: "create" | "edit";
  initial?: InitialData;
  /** Tujuan setelah proyek baru dibuat atau dihapus; bawaan: daftar proyek. */
  kembaliKe?: string;
  /**
   * Bila diisi, tampilkan pemilihan kontraktor pelaksana (penugasan satu
   * kontraktor per proyek). Diberikan pada halaman admin dan pemerintah yang
   * ikut menetapkan pelaksana.
   */
  kontraktor?: OpsiKontraktor[];
  /** Nama profil akun pemerintah yang menjadi pilihan satuan kerja. */
  satuanKerja?: string[];
}) {
  const router = useRouter();
  const [board, setBoard] = useState<Blok>(() =>
    initial ? blokDariApi(initial.board) : { ...BLOK_KOSONG },
  );
  // Catatan resmi tertaut tidak punya pemilih lagi di formulir; tautan yang
  // sudah ada (proyek lama) dipertahankan apa adanya saat menyimpan.
  const recordTerkait =
    initial?.officialRecord && initial.recordId
      ? rekamanDariApi(initial.recordId, initial.officialRecord)
      : null;
  const [contractorId, setContractorId] = useState(initial?.contractorId ?? "");
  const [kotor, setKotor] = useState(false);
  const [sedangProses, setSedangProses] = useState(false);
  const [tampilkanGalat, setTampilkanGalat] = useState(false);
  const [dialogNonaktif, setDialogNonaktif] = useState(false);
  // Galat 422 dari server ditumpuk di bawah galat klien sampai isian berubah.
  const [galatServer, setGalatFieldServer] = useState<FieldErrors | null>(null);

  const galatField: FieldErrors = useMemo(() => ({ board: validasiBlok(board) }), [board]);

  // Peringatan sebelum meninggalkan halaman bila ada perubahan belum tersimpan.
  useEffect(() => {
    if (!kotor) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome memakai returnValue; preventDefault untuk Firefox.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [kotor]);

  function ubahBlok(key: FieldKey, value: string) {
    setBoard((sebelumnya) => ({ ...sebelumnya, [key]: value }));
    setKotor(true);
    setGalatFieldServer(null);
  }

  // Kirim data: POST (buat) atau PATCH (ubah). Mengembalikan id/slug bila
  // berhasil, atau null bila galat (galat sudah ditampilkan).
  async function simpanData(): Promise<{ id: string; slug: string } | null> {
    const payload = {
      board: blokKeApi(board),
      featured: initial?.featured ?? false,
      ...(kontraktor ? { contractorId: contractorId || null } : {}),
      // Tautan registry hanya dikirim bila memang tertaut — tanpa pemilih di
      // formulir, mengirim null berarti melepas tautan yang tak bisa dipulihkan.
      ...(recordTerkait ? { recordId: recordTerkait.id } : {}),
    };
    const res =
      mode === "create"
        ? await fetch("/api/admin/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/projects/${initial?.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

    if (res.ok) {
      const data = (await res.json()) as { id: string; slug: string };
      return { id: data.id ?? initial?.id ?? "", slug: data.slug ?? initial?.slug ?? "" };
    }

    const galat = await bacaGalat(res);
    if (res.status === 401) {
      toast.error(PESAN_SESI_HABIS);
      return null;
    }
    if (galat.details && galat.details.length > 0) {
      const dariServer: FieldErrors = {};
      for (const detail of galat.details) {
        const sisi = detail.path[0];
        const kunci = detail.path[1];
        if (sisi === "board" && typeof kunci === "string") {
          dariServer[sisi] = { ...(dariServer[sisi] ?? {}), [kunci]: detail.message };
        }
      }
      if (Object.keys(dariServer).length > 0) {
        setTampilkanGalat(true);
        // Gabungkan galat server agar terlihat sampai isian berubah.
        setGalatFieldServer(dariServer);
        toast.error("Periksa isian yang ditandai di bawah.");
        return null;
      }
    }
    toast.error(galat.message ?? "Terjadi kesalahan internal.");
    return null;
  }

  const galatGabungan: FieldErrors = useMemo(() => {
    if (!galatServer) return galatField;
    return {
      board: { ...(galatServer.board ?? {}), ...(galatField.board ?? {}) },
    };
  }, [galatServer, galatField]);
  const adaGalatGabungan = Object.keys(galatGabungan.board ?? {}).length > 0;

  // Simpan proyek (POST baru / PATCH ubah). Tidak ada langkah terbit terpisah:
  // proyek yang tersimpan langsung tampil publik.
  async function simpan() {
    setSedangProses(true);
    setTampilkanGalat(true);
    const hasil = await simpanData();
    if (!hasil) {
      setSedangProses(false);
      return;
    }
    setKotor(false);
    toast.success(mode === "edit" ? "Perubahan tersimpan." : "Proyek tersimpan.");
    // Alihkan langsung setelah tersimpan; daftar menampilkan data terbaru.
    router.push(kembaliKe ?? "/dashboard/proyek");
  }

  async function nonaktifkan() {
    setSedangProses(true);
    const res = await fetch(`/api/admin/projects/${initial?.id}`, { method: "DELETE" });
    setDialogNonaktif(false);
    if (res.ok) {
      setKotor(false);
      toast.success("Proyek dinonaktifkan.");
      router.push(kembaliKe ?? "/dashboard/proyek");
      return;
    }
    const galat = await bacaGalat(res);
    if (res.status === 401) toast.error(PESAN_SESI_HABIS);
    else toast.error(galat.message ?? "Terjadi kesalahan internal.");
    setSedangProses(false);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void simpan();
      }}
      noValidate
    >
      {mode === "edit" && initial ? (
        <p className="text-sm text-neutral-700">
          Slug dossier: <span className="font-mono font-semibold">{initial.slug}</span>{" "}
          <span className="text-neutral-600">(tetap, tidak berubah)</span>
        </p>
      ) : null}

      <BlokFormulir
        blok={board}
        galat={galatGabungan.board ?? {}}
        tampilkanGalat={tampilkanGalat}
        onChange={ubahBlok}
        kontraktor={kontraktor ?? []}
        satuanKerja={satuanKerja ?? []}
        kontraktorId={contractorId}
        saatPilihKontraktor={(id) => {
          setContractorId(id);
          setKotor(true);
        }}
      />

      {/* Perbandingan dengan catatan resmi hanya bila proyek memang sudah
          tertaut registry — formulir tidak lagi menyediakan pemilihnya. */}
      {recordTerkait ? (
        <PratinjauStatus
          board={blokKePerbandingan(board)}
          record={rekamanKePerbandingan(recordTerkait)}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" isDisabled={sedangProses || adaGalatGabungan}>
          Simpan
        </Button>
        {mode === "edit" ? (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDialogNonaktif(true)}
            isDisabled={sedangProses}
          >
            Nonaktifkan proyek
          </Button>
        ) : null}
      </div>

      <Dialog isOpen={dialogNonaktif} onOpenChange={setDialogNonaktif} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Nonaktifkan proyek?</DialogTitle>
          <DialogDescription>
            Proyek tidak akan tampil lagi di situs. QR yang sudah dicetak akan menampilkan pesan
            &quot;sedang ditinjau&quot;. Lanjutkan?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogNonaktif(false)}
            isDisabled={sedangProses}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => void nonaktifkan()}
            isDisabled={sedangProses}
          >
            Nonaktifkan proyek
          </Button>
        </DialogFooter>
      </Dialog>
    </form>
  );
}
