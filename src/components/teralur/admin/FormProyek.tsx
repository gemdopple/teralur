"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PratinjauStatus } from "./PratinjauStatus";
import { RING_NOTE, computeTimeRing } from "@/lib/cincin";
import { parseNilaiUang } from "@/lib/nilai-uang";
import type { ApiBoard } from "@/lib/api-contract";

// Formulir proyek admin (Lampiran L.3, T-42): dua blok (Data papan dan Data
// resmi simulasi) dengan pratinjau status langsung (compare() yang sama) dan
// pratinjau cincin waktu (computeTimeRing). Dipakai di /admin/projects/new dan
// /admin/projects/[id].

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
  | "locationText";

type Blok = Record<FieldKey, string>;
type Sisi = "board" | "record";

type InitialData = {
  id: string;
  slug: string;
  published: boolean;
  featured: boolean;
  board: ApiBoard;
  officialRecord: ApiBoard | null;
};

type FieldErrors = Partial<Record<Sisi, Partial<Record<FieldKey, string>>>>;

// Batas panjang dan aturan per field (Lampiran L.3 / D.1).
const BATAS_PANJANG: Partial<Record<FieldKey, number>> = {
  packageName: 300,
  supplier: 200,
  fundingSource: 200,
  agencyUnit: 200,
  contractNumber: 100,
  locationText: 300,
};

const LABEL_FIELD: Record<FieldKey, string> = {
  packageName: "Nama paket",
  supplier: "Penyedia",
  contractValue: "Nilai kontrak (Rp)",
  durationDays: "Masa pelaksanaan (hari kalender)",
  fiscalYear: "Tahun anggaran",
  fundingSource: "Sumber dana",
  agencyUnit: "Satuan kerja",
  contractNumber: "Nomor kontrak",
  contractDate: "Tanggal kontrak",
  locationText: "Lokasi",
};

// Urutan tampil di formulir, sesuai tabel L.3.
const URUTAN_FIELD: FieldKey[] = [
  "packageName",
  "supplier",
  "contractValue",
  "durationDays",
  "fiscalYear",
  "fundingSource",
  "agencyUnit",
  "contractNumber",
  "contractDate",
  "locationText",
];

const NAMA_SISI: Record<Sisi, string> = {
  board: "Data papan",
  record: "Data resmi",
};

const BLOK_KOSONG: Blok = {
  packageName: "",
  supplier: "",
  contractValue: "",
  durationDays: "",
  fiscalYear: "",
  fundingSource: "",
  agencyUnit: "",
  contractNumber: "",
  contractDate: "",
  locationText: "",
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

function blokDariApi(api: ApiBoard): Blok {
  return {
    packageName: api.packageName ?? "",
    supplier: api.supplier ?? "",
    contractValue:
      typeof api.contractValue === "number" ? formatAngkaInput(String(api.contractValue)) : "",
    durationDays: api.durationDays === null || api.durationDays === undefined ? "" : String(api.durationDays),
    fiscalYear: api.fiscalYear === null || api.fiscalYear === undefined ? "" : String(api.fiscalYear),
    fundingSource: api.fundingSource ?? "",
    agencyUnit: api.agencyUnit ?? "",
    contractNumber: api.contractNumber ?? "",
    contractDate: api.contractDate ?? "",
    locationText: api.locationText ?? "",
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
};

// Ubah isi blok menjadi payload API (Lampiran D.1): teks kosong → null,
// nilai kontrak diparse dengan parser D.2, angka divalidasi rentang.
function blokKeApi(blok: Blok): ApiBlok {
  const nilai = parseNilaiUang(blok.contractValue);
  return {
    packageName: blok.packageName.trim() || null,
    supplier: blok.supplier.trim() || null,
    contractValue: nilai,
    durationDays: angkaAtauKosong(blok.durationDays),
    fiscalYear: angkaAtauKosong(blok.fiscalYear),
    fundingSource: blok.fundingSource.trim() || null,
    agencyUnit: blok.agencyUnit.trim() || null,
    contractNumber: blok.contractNumber.trim() || null,
    contractDate: blok.contractDate.trim() || null,
    locationText: blok.locationText.trim() || null,
  };
}

// BoardLike untuk compare() (Lampiran F.3) dari isi blok.
function blokKePerbandingan(blok: Blok): { packageName: string | null; supplier: string | null; contractValue: number | null } {
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

// Validasi klien per field (L.3): wajib papan hanya nama paket; wajib resmi
// nama paket + penyedia + nilai kontrak; rentang angka; tanggal TTTT-BB-HH.
function validasiBlok(blok: Blok, sisi: Sisi): Partial<Record<FieldKey, string>> {
  const galat: Partial<Record<FieldKey, string>> = {};

  const nama = blok.packageName.trim();
  if (nama === "") galat.packageName = "Nama paket wajib diisi.";
  else if (nama.length > BATAS_PANJANG.packageName!)
    galat.packageName = "Nama paket maksimal 300 karakter.";

  const penyedia = blok.supplier.trim();
  if (sisi === "record" && penyedia === "") galat.supplier = "Penyedia wajib diisi.";
  else if (penyedia.length > BATAS_PANJANG.supplier!)
    galat.supplier = "Penyedia maksimal 200 karakter.";

  const nilaiTeks = blok.contractValue.trim();
  if (sisi === "record" && nilaiTeks === "") {
    galat.contractValue = "Nilai kontrak wajib diisi.";
  } else if (nilaiTeks !== "") {
    const nilai = parseNilaiUang(nilaiTeks);
    if (nilai === null) galat.contractValue = GALAT_NILAI;
    else if (nilai > NILAI_MAKSIMAL) galat.contractValue = "Nilai kontrak melebihi batas maksimal.";
  }

  const masa = angkaAtauKosong(blok.durationDays);
  if (blok.durationDays.trim() !== "") {
    if (masa === null || masa < 1 || masa > 3650)
      galat.durationDays = "Masa pelaksanaan harus angka 1–3650.";
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
  children,
}: {
  idFor: string;
  label: string;
  required?: boolean;
  galat?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
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

function BlokFormulir({
  sisi,
  blok,
  galat,
  tampilkanGalat,
  onChange,
  salinDariPapan,
}: {
  sisi: Sisi;
  blok: Blok;
  galat: Partial<Record<FieldKey, string>>;
  tampilkanGalat: boolean;
  onChange: (key: FieldKey, value: string) => void;
  salinDariPapan?: () => void;
}) {
  const nilaiTerbaca = parseNilaiUang(blok.contractValue);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle>{NAMA_SISI[sisi]}</CardTitle>
        {salinDariPapan ? (
          <Button type="button" variant="outline" size="sm" onClick={salinDariPapan}>
            Salin dari papan
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {URUTAN_FIELD.map((key) => {
          const id = `${sisi}-${key}`;
          const err = tampilkanGalat ? galat[key] : undefined;
          const wajib =
            (sisi === "board" && key === "packageName") ||
            (sisi === "record" &&
              (key === "packageName" || key === "supplier" || key === "contractValue"));
          const tipe =
            key === "contractValue" ? "text" : key === "contractDate" ? "date" : "text";
          const inputMode =
            key === "contractValue" || key === "durationDays" || key === "fiscalYear"
              ? "numeric"
              : undefined;
          const maks = BATAS_PANJANG[key];
          const hint =
            key === "contractValue" && nilaiTerbaca !== null
              ? formatRupiah(nilaiTerbaca)
              : undefined;
          return (
            <Kolom key={key} idFor={id} label={LABEL_FIELD[key]} required={wajib} galat={err} hint={hint}>
              <Input
                id={id}
                name={id}
                type={tipe}
                inputMode={inputMode}
                value={blok[key]}
                maxLength={maks}
                onChange={(e) => {
                  const raw = e.target.value;
                  onChange(key, key === "contractValue" ? formatAngkaInput(raw) : raw);
                }}
                aria-invalid={err ? true : undefined}
                aria-describedby={err ? `${id}-galat` : hint ? `${id}-ket` : undefined}
              />
            </Kolom>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function FormProyek({
  mode,
  initial,
  today,
}: {
  mode: "create" | "edit";
  initial?: InitialData;
  // Tanggal hari ini WIB (dari jakartaToday()) yang dihitung di server halaman
  // — bukan saat render komponen, agar prerender tidak menyentuh Date.now().
  today: string;
}) {
  const router = useRouter();
  const [board, setBoard] = useState<Blok>(() =>
    initial ? blokDariApi(initial.board) : { ...BLOK_KOSONG },
  );
  const [record, setRecord] = useState<Blok>(() =>
    initial?.officialRecord ? blokDariApi(initial.officialRecord) : { ...BLOK_KOSONG },
  );
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [published, setPublished] = useState(initial?.published ?? false);
  const [kotor, setKotor] = useState(false);
  const [sedangProses, setSedangProses] = useState(false);
  const [tampilkanGalat, setTampilkanGalat] = useState(false);
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);
  const [pesanAtas, setPesanAtas] = useState<string | null>(null);
  const [galatFeatured, setGalatFeatured] = useState<string | null>(null);
  const [dialogNonaktif, setDialogNonaktif] = useState(false);
  // Galat 422 dari server ditumpuk di bawah galat klien sampai isian berubah.
  const [galatServer, setGalatFieldServer] = useState<FieldErrors | null>(null);

  const galatField: FieldErrors = useMemo(
    () => ({ board: validasiBlok(board, "board"), record: validasiBlok(record, "record") }),
    [board, record],
  );

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

  function ubahBlok(sisi: Sisi, key: FieldKey, value: string) {
    const setter = sisi === "board" ? setBoard : setRecord;
    setter((sebelumnya) => ({ ...sebelumnya, [key]: value }));
    setKotor(true);
    setPesanSukses(null);
    setGalatFieldServer(null);
  }

  function salinDariPapan() {
    setRecord({ ...board });
    setKotor(true);
    setPesanSukses(null);
    setGalatFieldServer(null);
  }

  // Kirim data: POST (buat) atau PATCH (ubah). Mengembalikan id/slug bila
  // berhasil, atau null bila galat (galat sudah ditampilkan).
  async function simpanData(): Promise<{ id: string; slug: string } | null> {
    const payload = {
      board: blokKeApi(board),
      officialRecord: blokKeApi(record),
      featured,
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
      setPesanAtas(PESAN_SESI_HABIS);
      return null;
    }
    if (galat.code === "FEATURED_LIMIT") {
      setGalatFeatured(galat.message ?? "Sudah ada 3 proyek unggulan. Lepas salah satu dulu.");
      return null;
    }
    if (galat.details && galat.details.length > 0) {
      const dariServer: FieldErrors = {};
      for (const detail of galat.details) {
        const sisi = detail.path[0];
        const kunci = detail.path[1];
        if ((sisi === "board" || sisi === "record") && typeof kunci === "string") {
          dariServer[sisi] = { ...(dariServer[sisi] ?? {}), [kunci]: detail.message };
        }
      }
      if (Object.keys(dariServer).length > 0) {
        setTampilkanGalat(true);
        setPesanAtas("Periksa isian yang ditandai di bawah.");
        // Gabungkan galat server agar terlihat sampai isian berubah.
        setGalatFieldServer(dariServer);
        return null;
      }
    }
    setPesanAtas(galat.message ?? "Terjadi kesalahan internal.");
    return null;
  }

  const galatGabungan: FieldErrors = useMemo(() => {
    if (!galatServer) return galatField;
    return {
      board: { ...(galatServer.board ?? {}), ...(galatField.board ?? {}) },
      record: { ...(galatServer.record ?? {}), ...(galatField.record ?? {}) },
    };
  }, [galatServer, galatField]);
  const adaGalatGabungan =
    Object.keys(galatGabungan.board ?? {}).length > 0 ||
    Object.keys(galatGabungan.record ?? {}).length > 0;

  async function simpanDraf() {
    setSedangProses(true);
    setPesanAtas(null);
    setPesanSukses(null);
    setGalatFeatured(null);
    setTampilkanGalat(true);
    const hasil = await simpanData();
    if (hasil) {
      setKotor(false);
      setPesanSukses("Draf tersimpan.");
      if (mode === "create") {
        router.push(`/admin/projects/${hasil.id}`);
      }
    }
    setSedangProses(false);
  }

  async function publikasikan() {
    setSedangProses(true);
    setPesanAtas(null);
    setPesanSukses(null);
    setGalatFeatured(null);
    setTampilkanGalat(true);
    const hasil = await simpanData();
    if (!hasil) {
      setSedangProses(false);
      return;
    }
    const res = await fetch(`/api/admin/projects/${hasil.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: true }),
    });
    if (res.ok) {
      setKotor(false);
      setPublished(true);
      setPesanSukses("Proyek diterbitkan.");
      if (mode === "create") {
        router.push(`/admin/projects/${hasil.id}`);
      }
    } else {
      const galat = await bacaGalat(res);
      if (res.status === 401) setPesanAtas(PESAN_SESI_HABIS);
      else setPesanAtas(galat.message ?? "Terjadi kesalahan internal.");
    }
    setSedangProses(false);
  }

  async function tarikDariPublik() {
    setSedangProses(true);
    setPesanAtas(null);
    setPesanSukses(null);
    const res = await fetch(`/api/admin/projects/${initial?.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: false }),
    });
    if (res.ok) {
      setPublished(false);
      setPesanSukses("Proyek ditarik dari publik.");
    } else {
      const galat = await bacaGalat(res);
      if (res.status === 401) setPesanAtas(PESAN_SESI_HABIS);
      else setPesanAtas(galat.message ?? "Terjadi kesalahan internal.");
    }
    setSedangProses(false);
  }

  async function nonaktifkan() {
    setSedangProses(true);
    setPesanAtas(null);
    const res = await fetch(`/api/admin/projects/${initial?.id}`, { method: "DELETE" });
    setDialogNonaktif(false);
    if (res.ok) {
      setKotor(false);
      router.push("/admin");
      return;
    }
    const galat = await bacaGalat(res);
    if (res.status === 401) setPesanAtas(PESAN_SESI_HABIS);
    else setPesanAtas(galat.message ?? "Terjadi kesalahan internal.");
    setSedangProses(false);
  }

  // Ringkasan galat untuk role="alert" di atas form.
  const ringkasanGalat: string[] = [];
  for (const sisi of ["board", "record"] as const) {
    for (const [kunci, pesan] of Object.entries(galatGabungan[sisi] ?? {})) {
      ringkasanGalat.push(`${NAMA_SISI[sisi]} — ${LABEL_FIELD[kunci as FieldKey]}: ${pesan}`);
    }
  }

  // Pratinjau cincin waktu (Lampiran G.1) dari nilai form saat ini.
  const ring = computeTimeRing({
    boardDurationDays: angkaAtauKosong(board.durationDays),
    recordDurationDays: angkaAtauKosong(record.durationDays),
    boardContractDate: board.contractDate.trim() || null,
    recordContractDate: record.contractDate.trim() || null,
    today,
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void simpanDraf();
      }}
      noValidate
    >
      {pesanAtas || (tampilkanGalat && ringkasanGalat.length > 0) ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <p className="font-medium">{pesanAtas ?? "Periksa isian berikut:"}</p>
          {ringkasanGalat.length > 0 ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {ringkasanGalat.map((baris) => (
                <li key={baris}>{baris}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {pesanSukses ? (
        <p
          role="status"
          className="rounded-md border border-cocok/40 bg-cocok/10 px-4 py-3 text-sm font-medium text-cocok"
        >
          {pesanSukses}
        </p>
      ) : null}

      {mode === "edit" && initial ? (
        <p className="text-sm text-neutral-700">
          Slug dossier: <span className="font-mono font-semibold">{initial.slug}</span>{" "}
          <span className="text-neutral-600">(tetap, tidak berubah)</span>
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <BlokFormulir
          sisi="board"
          blok={board}
          galat={galatGabungan.board ?? {}}
          tampilkanGalat={tampilkanGalat}
          onChange={(key, value) => ubahBlok("board", key, value)}
        />
        <BlokFormulir
          sisi="record"
          blok={record}
          galat={galatGabungan.record ?? {}}
          tampilkanGalat={tampilkanGalat}
          onChange={(key, value) => ubahBlok("record", key, value)}
          salinDariPapan={salinDariPapan}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PratinjauStatus
          board={blokKePerbandingan(board)}
          record={blokKePerbandingan(record)}
        />
        <section
          className="rounded-md border border-border bg-card p-4"
          aria-label="Pratinjau cincin waktu"
        >
          <h2 className="font-heading text-lg font-bold">Pratinjau cincin waktu</h2>
          <p className="mt-3 text-sm font-semibold">{ring.caption}</p>
          <p className="mt-1 text-xs text-neutral-600">{RING_NOTE}</p>
        </section>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <input
            id="featured"
            name="featured"
            type="checkbox"
            checked={featured}
            onChange={(e) => {
              setFeatured(e.target.checked);
              setKotor(true);
              setGalatFeatured(null);
            }}
            className="mt-0.5 size-4 rounded border-neutral-400 accent-neutral-900"
          />
          <div>
            <Label htmlFor="featured" className="font-normal">
              Tampilkan di Contoh Kasus
            </Label>
            {galatFeatured ? (
              <p className="mt-1 text-xs font-medium text-destructive" id="featured-galat">
                {galatFeatured}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="outline" isDisabled={sedangProses}>
            Simpan draf
          </Button>
          <Button
            type="button"
            onClick={() => void publikasikan()}
            isDisabled={sedangProses || adaGalatGabungan}
          >
            Publikasikan
          </Button>
          {mode === "edit" && published ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void tarikDariPublik()}
              isDisabled={sedangProses}
            >
              Tarik dari publik
            </Button>
          ) : null}
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
      </div>

      <Dialog isOpen={dialogNonaktif} onOpenChange={setDialogNonaktif} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Nonaktifkan proyek?</DialogTitle>
            <DialogDescription>
              Proyek tidak akan tampil lagi di situs. QR yang sudah dicetak akan menampilkan
              pesan &quot;sedang ditinjau&quot;. Lanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogNonaktif(false)} isDisabled={sedangProses}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => void nonaktifkan()} isDisabled={sedangProses}>
              Nonaktifkan proyek
            </Button>
          </DialogFooter>
      </Dialog>
    </form>
  );
}
