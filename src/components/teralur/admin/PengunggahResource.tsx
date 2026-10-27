"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { formatTanggal } from "@/lib/dates";

// PengunggahResource (T-45 UI, Lampiran L.4 + J.3): area unggah (klik atau
// seret) menerima .jpg,.jpeg,.png,.webp,.pdf; kolom Judul wajib sebelum tombol
// Unggah aktif; foto dikecilkan di browser SEBELUM unggah (sisi terpanjang
// 1600 px, JPEG kualitas 0,8 — juga membuang EXIF, J.3); PDF > 4 MB ditolak
// tanpa dikirim; progres sederhana "Mengunggah…"; sukses menambah daftar
// tanpa muat ulang; galat 400/413/429/401 dipetakan ke pesan Indonesia jelas,
// pesan baku E.8 dari server ditampilkan verbatim.

export type ResourceAdmin = {
  id: string;
  kind: "photo" | "document";
  title: string;
  url: string;
  size: number;
  createdAt: string;
};

const MAKS_BYTES = 4 * 1024 * 1024;
const PESAN_SESI_HABIS = "Sesi berakhir. Masuk lagi.";
const PESAN_BESAR = "Berkas terlalu besar. Maksimal 4 MB.";
const PESAN_TIPE = "Berkas harus berupa foto JPEG, PNG, WebP, atau PDF.";
const PESAN_JUDUL = "Judul wajib diisi.";

// Util pengecilan foto (J.3). Catatan: util T-13 di ApiBoardForm.tsx bersifat
// privat modul (tidak diekspor) dan jalur foto beku, jadi algoritma yang sama
// (sisi terpanjang 1600 px, JPEG q0.8, canvas → EXIF terbuang) diimplementasi
// ulang di sini — dicatat di docs/agent-notes.md.
async function kecilkanFoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const skala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * skala));
    canvas.height = Math.max(1, Math.round(bitmap.height * skala));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Foto tidak dapat diproses di perangkat ini.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8),
    );
    if (!blob) throw new Error("Foto tidak dapat diproses di perangkat ini.");
    return blob;
  } finally {
    bitmap.close();
  }
}

function deteksiJenis(file: File): "photo" | "document" | null {
  const tipe = file.type.toLowerCase();
  if (tipe.startsWith("image/")) return "photo";
  if (tipe === "application/pdf") return "document";
  const nama = file.name.toLowerCase();
  if (/\.(jpe?g|png|webp)$/.test(nama)) return "photo";
  if (nama.endsWith(".pdf")) return "document";
  return null;
}

function formatUkuran(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PengunggahResource({
  projectId,
  initialResources,
}: {
  projectId: string;
  initialResources: ResourceAdmin[];
}) {
  const [resources, setResources] = useState<ResourceAdmin[]>(initialResources);
  const [judul, setJudul] = useState("");
  const [berkas, setBerkas] = useState<File | null>(null);
  const [seret, setSeret] = useState(false);
  const [mengunggah, setMengunggah] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [pesanSukses, setPesanSukses] = useState<string | null>(null);
  const [menghapus, setMenghapus] = useState<string | null>(null);
  const inputBerkas = useRef<HTMLInputElement>(null);

  const penuh = resources.length >= 10;

  function pilihBerkas(file: File | null) {
    setGalat(null);
    setPesanSukses(null);
    if (!file) {
      setBerkas(null);
      return;
    }
    const jenis = deteksiJenis(file);
    if (!jenis) {
      setBerkas(null);
      setGalat(PESAN_TIPE);
      return;
    }
    // PDF > 4 MB ditolak di browser tanpa dikirim (J.3). Foto dikecilkan saat
    // unggah sehingga lolos batas; hasil kecilkan tetap dicek sebelum kirim.
    if (jenis === "document" && file.size > MAKS_BYTES) {
      setBerkas(null);
      setGalat(PESAN_BESAR);
      return;
    }
    setBerkas(file);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    pilihBerkas(event.target.files?.[0] ?? null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setSeret(false);
    pilihBerkas(event.dataTransfer.files?.[0] ?? null);
  }

  async function unggah() {
    if (!berkas || judul.trim() === "") {
      setGalat(PESAN_JUDUL);
      return;
    }
    setMengunggah(true);
    setGalat(null);
    setPesanSukses(null);
    try {
      const jenis = deteksiJenis(berkas);
      if (!jenis) {
        setGalat(PESAN_TIPE);
        return;
      }

      let payload: Blob = berkas;
      let namaBerkas = berkas.name;
      if (jenis === "photo") {
        payload = await kecilkanFoto(berkas);
        namaBerkas = "foto.jpg";
        if (payload.size > MAKS_BYTES) {
          setGalat(PESAN_BESAR);
          return;
        }
      }

      const form = new FormData();
      form.append("file", new File([payload], namaBerkas, { type: jenis === "photo" ? "image/jpeg" : "application/pdf" }));
      form.append("title", judul.trim());
      form.append("kind", jenis);

      const res = await fetch(`/api/admin/projects/${projectId}/resources`, {
        method: "POST",
        body: form,
      });
      if (res.status === 401) {
        setGalat(PESAN_SESI_HABIS);
        return;
      }
      if (res.status === 413) {
        setGalat(PESAN_BESAR);
        return;
      }
      if (!res.ok) {
        let pesan = "Terjadi kesalahan internal.";
        try {
          const body = (await res.json()) as { message?: string };
          if (body.message) pesan = body.message; // pesan baku E.8, verbatim
        } catch {
          // body bukan JSON — pakai pesan bawaan.
        }
        setGalat(pesan);
        return;
      }
      const hasil = (await res.json()) as { resource: ResourceAdmin };
      setResources((sebelumnya) => [...sebelumnya, hasil.resource]);
      setJudul("");
      setBerkas(null);
      if (inputBerkas.current) inputBerkas.current.value = "";
      setPesanSukses("Berkas terunggah.");
    } catch {
      setGalat("Berkas belum dapat diunggah. Coba lagi.");
    } finally {
      setMengunggah(false);
    }
  }

  async function hapus(resource: ResourceAdmin) {
    if (!window.confirm(`Hapus berkas "${resource.title}" dari proyek ini?`)) return;
    setMenghapus(resource.id);
    setGalat(null);
    setPesanSukses(null);
    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, { method: "DELETE" });
      if (res.ok) {
        setResources((sebelumnya) => sebelumnya.filter((item) => item.id !== resource.id));
        setPesanSukses("Berkas dihapus.");
      } else if (res.status === 401) {
        setGalat(PESAN_SESI_HABIS);
      } else {
        let pesan = "Berkas belum dapat dihapus. Coba lagi.";
        try {
          const body = (await res.json()) as { message?: string };
          if (body.message) pesan = body.message;
        } catch {
          // body bukan JSON.
        }
        setGalat(pesan);
      }
    } catch {
      setGalat("Berkas belum dapat dihapus. Coba lagi.");
    } finally {
      setMenghapus(null);
    }
  }

  return (
    // id + scroll-mt: aksi "Resource" di daftar proyek menautkan ke sini.
    <section id="resource" aria-label="Resource proyek" className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-lg font-bold">Resource</h2>
        <p className="text-sm text-neutral-700">{resources.length} dari 10 berkas</p>
      </div>

      {/* Area unggah: klik atau seret (L.4). */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setSeret(true);
        }}
        onDragLeave={() => setSeret(false)}
        onDrop={onDrop}
        className={`mt-3 rounded-xl border-2 border-dashed p-4 text-center ${
          seret ? "border-hitam-aspal bg-kuning-papan/40" : "border-neutral-400 bg-white"
        }`}
      >
        <input
          ref={inputBerkas}
          id="resource-file"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={onChange}
          className="sr-only"
          disabled={penuh || mengunggah}
        />
        <label
          htmlFor="resource-file"
          className="inline-flex min-h-11 cursor-pointer items-center rounded-md border-2 border-black bg-white px-4 py-2 text-sm font-semibold"
        >
          Pilih berkas
        </label>
        <p className="mt-2 text-xs text-neutral-600">
          Foto (JPEG, PNG, WebP) atau PDF, maksimal 4 MB. Foto dikecilkan di
          peramban sebelum diunggah.{" "}
          {berkas ? (
            <span className="font-semibold text-hitam-aspal">Dipilih: {berkas.name}</span>
          ) : null}
        </p>

        <div className="mx-auto mt-3 max-w-md space-y-2 text-left">
          <label htmlFor="resource-title" className="block text-sm font-semibold">
            Judul <span className="text-destructive">*</span>
          </label>
          <input
            id="resource-title"
            type="text"
            value={judul}
            maxLength={200}
            onChange={(event) => {
              setJudul(event.target.value);
              setGalat(null);
              setPesanSukses(null);
            }}
            className="w-full rounded-md border border-neutral-400 px-3 py-2"
            placeholder="mis. Papan proyek tampak depan"
          />
          <button
            type="button"
            onClick={() => void unggah()}
            disabled={mengunggah || penuh || berkas === null || judul.trim() === ""}
            className="inline-flex min-h-11 items-center rounded-md border-2 border-black bg-kuning-papan px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mengunggah ? "Mengunggah…" : "Unggah"}
          </button>
          {penuh ? (
            <p className="text-xs font-medium text-destructive">
              Proyek ini sudah memuat 10 berkas. Hapus satu dulu.
            </p>
          ) : null}
        </div>
      </div>

      {galat ? (
        <p role="alert" className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {galat}
        </p>
      ) : null}
      {pesanSukses && !galat ? (
        <p role="status" className="mt-3 rounded-md border border-cocok/40 bg-cocok/10 px-4 py-3 text-sm font-medium text-cocok-teks">
          {pesanSukses}
        </p>
      ) : null}

      {resources.length > 0 ? (
        <ul className="mt-4 divide-y divide-neutral-200 rounded-xl border border-neutral-300 bg-white">
          {resources.map((resource) => (
            <li key={resource.id} className="flex items-center gap-3 p-3">
              {resource.kind === "photo" ? (
                <Image
                  src={resource.url}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="size-12 shrink-0 rounded-md border border-neutral-200 object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-neutral-100 text-lg"
                >
                  📄
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold">{resource.title}</p>
                <p className="text-xs text-neutral-600">
                  {resource.kind === "photo" ? "Foto" : "PDF"} · {formatUkuran(resource.size)} ·{" "}
                  {formatTanggal(resource.createdAt.slice(0, 10))}
                </p>
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-neutral-400 px-3 py-1.5 text-sm font-medium"
              >
                Lihat
              </a>
              <button
                type="button"
                onClick={() => void hapus(resource)}
                disabled={menghapus === resource.id}
                className="rounded-md border border-destructive/50 px-3 py-1.5 text-sm font-medium text-destructive disabled:opacity-50"
              >
                {menghapus === resource.id ? "Menghapus…" : "Hapus"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-700">
          Belum ada berkas pada proyek ini.
        </p>
      )}
    </section>
  );
}
