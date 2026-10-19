"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import type { ApiBoard } from "@/lib/api-contract";

const MATCH_RESPONSE = z.object({ slug: z.string().min(1) });
const EMPTY_BOARD: ApiBoard = {
  packageName: null,
  supplier: null,
  contractValue: null,
  durationDays: null,
  fiscalYear: null,
  fundingSource: null,
  agencyUnit: null,
  contractNumber: null,
  contractDate: null,
  locationText: null,
};

function numericValue(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

async function makeUploadImage(file: File): Promise<Blob> {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Foto asli terlalu besar. Pilih foto berukuran di bawah 20 MB.");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Foto tidak dapat diproses di perangkat ini.");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.8),
  );
  if (!blob) throw new Error("Foto tidak dapat diproses di perangkat ini.");
  if (blob.size > 4 * 1024 * 1024) {
    throw new Error("Hasil foto masih lebih dari 4 MB. Pilih foto yang lebih kecil.");
  }
  return blob;
}

export function ApiBoardForm() {
  const router = useRouter();
  const [board, setBoard] = useState<ApiBoard>(EMPTY_BOARD);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);

  const keyFieldCount = [
    board.packageName?.trim(),
    board.supplier?.trim(),
    board.contractValue,
  ].filter((value) => value !== null && value !== undefined && value !== "").length;

  function updateBoard(values: Partial<ApiBoard>) {
    setBoard((current) => ({ ...current, ...values }));
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Pilih foto JPEG, PNG, atau WebP.");
      return;
    }
    setWorking(true);
    setMessage("Foto diperkecil di perangkat. Ekstraksi otomatis belum dikonfigurasi.");
    try {
      const compressed = await makeUploadImage(file);
      const form = new FormData();
      form.append("photo", compressed, "project-sign.jpg");
      const response = await fetch("/api/extract", { method: "POST", body: form });
      const payload: unknown = await response.json();
      const parsed = z.object({ message: z.string().optional() }).safeParse(payload);
      if (!response.ok) {
        setMessage(
          parsed.success && parsed.data.message
            ? parsed.data.message
            : "Ekstraksi tidak tersedia. Isi formulir secara manual.",
        );
        return;
      }
      setMessage("Foto berhasil dibaca.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Foto tidak dapat diproses.");
    } finally {
      setWorking(false);
      input.value = "";
    }
  }

  async function submitBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (keyFieldCount < 2) {
      setMessage("Isi minimal 2 dari 3 field kunci sebelum mencocokkan.");
      return;
    }
    if (
      (board.contractValue !== null && !Number.isFinite(board.contractValue)) ||
      (board.durationDays !== null &&
        (!Number.isInteger(board.durationDays) || board.durationDays <= 0)) ||
      (board.fiscalYear !== null && !Number.isInteger(board.fiscalYear))
    ) {
      setMessage("Periksa kembali nilai kontrak, masa hari, dan tahun.");
      return;
    }

    setWorking(true);
    setMessage("Mencocokkan dengan catatan resmi…");
    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ board }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const parsedError = z.object({ message: z.string().optional() }).safeParse(payload);
        setMessage(
          parsedError.success && parsedError.data.message
            ? parsedError.data.message
            : "Pencocokan belum dapat dilakukan.",
        );
        return;
      }
      const parsed = MATCH_RESPONSE.safeParse(payload);
      if (!parsed.success) throw new Error("Respons pencocokan tidak valid.");
      router.push(`/dossiers/${parsed.data.slug}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pencocokan belum dapat dilakukan.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="rounded-xl border-2 border-black bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Foto papan (opsional)</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Foto diperkecil di perangkat dan tidak disimpan. Sampai penyedia model dipilih, isi
          data secara manual.
        </p>
        <label className="mt-5 block text-sm font-semibold" htmlFor="photo">
          Pilih foto
        </label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={handlePhoto}
          disabled={working}
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#FFC400] file:px-4 file:py-2 file:font-semibold"
        />
        <p className="mt-2 text-xs text-neutral-600">JPEG, PNG, atau WebP; hasil maksimal 4 MB.</p>
      </section>

      <form onSubmit={submitBoard} className="rounded-xl border-2 border-black bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Konfirmasi data papan</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Isi minimal dua dari tiga field kunci: nama paket, penyedia, dan nilai kontrak.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold">Nama paket</span>
            <input
              value={board.packageName ?? ""}
              onChange={(event) => updateBoard({ packageName: event.target.value || null })}
              className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
              autoComplete="off"
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Penyedia</span>
            <input
              value={board.supplier ?? ""}
              onChange={(event) => updateBoard({ supplier: event.target.value || null })}
              className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
              autoComplete="organization"
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Nilai kontrak (rupiah)</span>
            <input
              inputMode="numeric"
              value={board.contractValue ?? ""}
              onChange={(event) =>
                updateBoard({ contractValue: numericValue(event.target.value.replace(/[^\d]/g, "")) })
              }
              className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Masa pelaksanaan (hari)</span>
            <input
              inputMode="numeric"
              value={board.durationDays ?? ""}
              onChange={(event) => updateBoard({ durationDays: numericValue(event.target.value) })}
              className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Tahun anggaran</span>
            <input
              inputMode="numeric"
              value={board.fiscalYear ?? ""}
              onChange={(event) => updateBoard({ fiscalYear: numericValue(event.target.value) })}
              className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Tanggal kontrak</span>
            <input
              type="date"
              value={board.contractDate ?? ""}
              onChange={(event) => updateBoard({ contractDate: event.target.value || null })}
              className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Sumber dana</span>
            <input
              value={board.fundingSource ?? ""}
              onChange={(event) => updateBoard({ fundingSource: event.target.value || null })}
              className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Satuan kerja</span>
            <input
              value={board.agencyUnit ?? ""}
              onChange={(event) => updateBoard({ agencyUnit: event.target.value || null })}
              className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Nomor kontrak</span>
            <input
              value={board.contractNumber ?? ""}
              onChange={(event) => updateBoard({ contractNumber: event.target.value || null })}
              className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold">Lokasi</span>
            <input
              value={board.locationText ?? ""}
              onChange={(event) => updateBoard({ locationText: event.target.value || null })}
              className="mt-1 w-full rounded-md border border-neutral-400 px-3 py-2"
            />
          </label>
        </div>
        {message && (
          <p role="status" className="mt-4 rounded-md bg-[#F5F5F5] p-3 text-sm">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={working || keyFieldCount < 2}
          className="mt-5 w-full rounded-md border-2 border-black bg-[#FFC400] px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {working ? "Memproses…" : "Konfirmasi dan cocokkan"}
        </button>
      </form>
    </div>
  );
}
