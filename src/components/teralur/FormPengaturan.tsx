"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/roles";

// Pengaturan per peran (konfigurasi pemerintah & kontraktor). Data aplikasi
// adalah simulasi; preferensi disimpan di perangkat (localStorage) dan halaman
// menyatakannya dengan jelas — tanpa klaim sinkronisasi server.

type NilaiPengaturan = Record<string, string>;

function bacaTersimpan(peran: AppRole): NilaiPengaturan {
  try {
    return JSON.parse(window.localStorage.getItem(KUNCI_SIMPAN[peran]) ?? "{}") as NilaiPengaturan;
  } catch {
    return {};
  }
}

const KUNCI_SIMPAN: Record<AppRole, string> = {
  pemerintah: "teralur.pengaturan.pemerintah",
  kontraktor: "teralur.pengaturan.kontraktor",
  admin: "teralur.pengaturan.admin",
};

type Bidang = {
  nama: string;
  label: string;
  tipe?: "text" | "email" | "tel" | "number";
  bantuan?: string;
  bawaan: string;
  placeholder?: string;
};

const BIDANG_PER_ROLE: Record<AppRole, Bidang[]> = {
  pemerintah: [
    {
      nama: "wilayahKerja",
      label: "Wilayah kerja",
      bantuan: "Nama daerah yang menjadi cakupan pemantauan Anda.",
      bawaan: "Kota Tirtamulya",
    },
    {
      nama: "ambangSelisih",
      label: "Ambang selisih nilai (persen)",
      tipe: "number",
      bantuan: "Selisih di atas angka ini ditandai lebih menonjol pada laporan.",
      bawaan: "5",
      placeholder: "5",
    },
    {
      nama: "emailNotifikasi",
      label: "Email notifikasi",
      tipe: "email",
      bantuan: "Tujuan ringkasan laporan warga dan selisih baru.",
      bawaan: "",
      placeholder: "nama@instansi.go.id",
    },
  ],
  kontraktor: [
    {
      nama: "namaPerusahaan",
      label: "Nama perusahaan",
      bantuan: "Tampil pada header dasbor kontraktor.",
      bawaan: "PT Karya Bangun Nusantara Jaya",
    },
    {
      nama: "emailOperasional",
      label: "Email operasional",
      tipe: "email",
      bantuan: "Kontak untuk klarifikasi data papan.",
      bawaan: "",
      placeholder: "operasional@perusahaan.co.id",
    },
    {
      nama: "telepon",
      label: "Nomor telepon",
      tipe: "tel",
      bantuan: "Opsional; dipakai saat klarifikasi lapangan.",
      bawaan: "",
      placeholder: "+62 8xx xxxx xxxx",
    },
  ],
  admin: [
    {
      nama: "domainSitus",
      label: "Domain situs (baca-saja)",
      bantuan: "Diatur lewat variabel lingkungan NEXT_PUBLIC_SITE_URL sebelum QR dicetak.",
      bawaan: "",
    },
  ],
};

export function FormPengaturan({
  peran,
  informasiAdmin,
}: {
  peran: AppRole;
  informasiAdmin?: { fotoFlow: boolean; situsUrl: string };
}) {
  const [nilai, setNilai] = useState<NilaiPengaturan>({});
  const [dimuat, setDimuat] = useState(false);

  useEffect(() => {
    // Sinkronisasi dengan localStorage (sistem eksternal) sekali saat mount:
    // nilai awal tidak dibaca saat render agar SSR dan hydrasi konsisten.
    /* eslint-disable react-hooks/set-state-in-effect -- sinkronisasi sekali dengan localStorage */
    setNilai(bacaTersimpan(peran));
    setDimuat(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [peran]);

  function simpan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const hasil: NilaiPengaturan = {};
    for (const [kunci, nilaiField] of data.entries()) {
      if (typeof nilaiField === "string") hasil[kunci] = nilaiField;
    }
    window.localStorage.setItem(KUNCI_SIMPAN[peran], JSON.stringify(hasil));
    setNilai(hasil);
    toast.success("Pengaturan tersimpan di perangkat ini.");
  }

  if (peran === "admin" && informasiAdmin) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Keadaan lingkungan</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Jalur foto (PHOTO_FLOW_ENABLED)</dt>
              <dd>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                    informasiAdmin.fotoFlow
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {informasiAdmin.fotoFlow ? "Aktif" : "Mati (dibekukan)"}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Domain situs</dt>
              <dd className="font-mono text-xs">{informasiAdmin.situsUrl || "belum diatur"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Domain wajib diisi sebelum kode QR dicetak agar papan memuat tautan yang benar.
          </p>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Konsol admin</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Perubahan isi situs (proyek, resource, penerbitan, QR, moderasi laporan) dilakukan di
            konsol admin.
          </p>
          <a href="/admin" className={cn(buttonVariants(), "mt-4 w-fit")}>
            Buka konsol admin
          </a>
        </article>
      </div>
    );
  }

  return (
    <form onSubmit={simpan} className="max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-sm">
      <fieldset disabled={!dimuat} className="space-y-5">
        {BIDANG_PER_ROLE[peran].map((bidang) => (
          <div key={bidang.nama} className="space-y-2">
            <Label htmlFor={bidang.nama}>{bidang.label}</Label>
            <Input
              id={bidang.nama}
              name={bidang.nama}
              type={bidang.tipe ?? "text"}
              defaultValue={nilai[bidang.nama] ?? bidang.bawaan}
              placeholder={bidang.placeholder}
              key={`${peran}-${bidang.nama}-${dimuat}`}
              className="rounded-xl border-border bg-white"
            />
            {bidang.bantuan && (
              <p className="text-xs leading-5 text-muted-foreground">{bidang.bantuan}</p>
            )}
          </div>
        ))}
        <button type="submit" className={cn(buttonVariants())}>
          Simpan pengaturan
        </button>
      </fieldset>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        Preferensi disimpan pada perangkat ini (localStorage) — tidak dikirim ke server.
      </p>
    </form>
  );
}
