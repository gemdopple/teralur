"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { z } from "zod";
import type { ApiBoard } from "@/lib/api-contract";
import { parseNilaiUang } from "@/lib/nilai-uang";

const MATCH_RESPONSE = z.object({ slug: z.string().min(1) });
const EXTRACT_RESPONSE = z.object({
  board: z.object({
    packageName: z.string().nullable(),
    supplier: z.string().nullable(),
    contractValue: z.number().nullable(),
    durationDays: z.number().nullable(),
    fiscalYear: z.number().nullable(),
    fundingSource: z.string().nullable(),
    agencyUnit: z.string().nullable(),
    contractNumber: z.string().nullable(),
    contractDate: z.string().nullable(),
    locationText: z.string().nullable(),
  }),
  unreadFields: z.array(z.string()).default([]),
});
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

// Teks §8.4: gagal baca.
const GAGAL_BACA = "Foto sulit dibaca. Isi manual saja, cukup 30 detik.";

async function makeUploadImage(
  file: File,
): Promise<{ blob: Blob; width: number; height: number }> {
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
  return { blob, width: canvas.width, height: canvas.height };
}

export function ApiBoardForm() {
  const router = useRouter();
  const [board, setBoard] = useState<ApiBoard>(EMPTY_BOARD);
  const [contractValueInput, setContractValueInput] = useState("");
  const [unreadFields, setUnreadFields] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const [preview, setPreview] = useState<{ url: string; width: number; height: number; sizeKB: number } | null>(null);

  const contractValue = parseNilaiUang(contractValueInput);
  const boardDenganNilai: ApiBoard = { ...board, contractValue };

  const keyFields = [
    { nama: "nama paket", terisi: Boolean(board.packageName?.trim()) },
    { nama: "penyedia", terisi: Boolean(board.supplier?.trim()) },
    { nama: "nilai kontrak", terisi: contractValue !== null },
  ];
  const keyFieldCount = keyFields.filter((f) => f.terisi).length;
  const gateTerpenuhi = keyFieldCount >= 2;
  const fieldKurang = keyFields.filter((f) => !f.terisi).map((f) => f.nama);

  // KP F-03: field kunci yang kosong saat gerbang 2-dari-3 belum terpenuhi tampil kuning.
  function kelasField(namaField: string): string {
    const unread = unreadFields.includes(namaField);
    const kunciKosong = !gateTerpenuhi && fieldKurang.includes(namaField);
    if (unread || kunciKosong) {
      return "mt-1 w-full rounded-md border-2 border-[#FFC400] bg-[#FFC400]/10 px-3 py-2";
    }
    return "mt-1 w-full rounded-md border border-neutral-400 px-3 py-2";
  }

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
    setMessage("Membaca papan...");
    try {
      const { blob: compressed, width, height } = await makeUploadImage(file);
      // Pratinjau hasil pengecilan; object URL diganti (direvoke) setiap foto baru.
      setPreview((lama) => {
        if (lama) URL.revokeObjectURL(lama.url);
        return { url: URL.createObjectURL(compressed), width, height, sizeKB: Math.round(compressed.size / 1024) };
      });
      const form = new FormData();
      form.append("photo", compressed, "project-sign.jpg");
      const response = await fetch("/api/extract", { method: "POST", body: form });
      const payload: unknown = await response.json();
      const parsed = z.object({ message: z.string().optional() }).safeParse(payload);
      if (!response.ok) {
        setMessage(
          parsed.success && parsed.data.message
            ? parsed.data.message
            : GAGAL_BACA,
        );
        return;
      }
      const hasil = EXTRACT_RESPONSE.safeParse(payload);
      if (!hasil.success) {
        setMessage(GAGAL_BACA);
        return;
      }
      // Prefill hasil ekstraksi; field yang tidak terbaca ditandai kuning (Alur A langkah 4).
      setBoard({ ...EMPTY_BOARD, ...hasil.data.board });
      setContractValueInput(hasil.data.board.contractValue !== null ? String(hasil.data.board.contractValue) : "");
      setUnreadFields(hasil.data.unreadFields);
      setMessage(
        hasil.data.unreadFields.length > 0
          ? "Papan terbaca sebagian. Field kuning tidak terbaca dari foto; periksa dan isi."
          : "Papan terbaca. Periksa isian sebelum mencocokkan.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : GAGAL_BACA);
    } finally {
      setWorking(false);
      input.value = "";
    }
  }

  async function submitBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!gateTerpenuhi) {
      setMessage(
        `Belum lengkap: ${fieldKurang.join(", ")}. Isi minimal 2 dari 3 field kunci.`,
      );
      return;
    }
    if (
      (contractValue !== null && !Number.isSafeInteger(contractValue)) ||
      (boardDenganNilai.durationDays !== null &&
        (!Number.isInteger(boardDenganNilai.durationDays) || boardDenganNilai.durationDays <= 0)) ||
      (boardDenganNilai.fiscalYear !== null && !Number.isInteger(boardDenganNilai.fiscalYear))
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
        body: JSON.stringify({ board: boardDenganNilai }),
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
          Foto diperkecil di perangkat dan tidak disimpan. Isian terbaca dipakai untuk
          mengisi formulir dan selalu dapat Anda perbaiki.
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
        {preview && (
          <figure className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- object URL lokal, bukan aset yang dioptimasi */}
            <img
              src={preview.url}
              alt="Pratinjau foto papan hasil pengecilan di perangkat"
              className="w-full rounded-md border border-neutral-300"
            />
            <figcaption className="mt-1 text-xs text-neutral-600">
              Pratinjau hasil pengecilan: {preview.width}×{preview.height} px,{" "}
              {preview.sizeKB} KB. Foto tidak disimpan.
            </figcaption>
          </figure>
        )}
      </section>

      <form onSubmit={submitBoard} className="rounded-xl border-2 border-black bg-white p-5">
        <h2 className="font-heading text-xl font-bold">Konfirmasi data papan</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Isi minimal dua dari tiga field kunci: nama paket, penyedia, dan nilai kontrak.
          Field kuning belum terbaca atau belum terisi.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold">Nama paket</span>
            <input
              value={board.packageName ?? ""}
              onChange={(event) => updateBoard({ packageName: event.target.value || null })}
              className={kelasField("packageName")}
              autoComplete="off"
            />
            {unreadFields.includes("packageName") && (
              <span className="mt-1 block text-xs text-neutral-600">
                Tidak terbaca dari foto. Periksa dan isi bila tahu.
              </span>
            )}
          </label>
          <label>
            <span className="text-sm font-semibold">Penyedia</span>
            <input
              value={board.supplier ?? ""}
              onChange={(event) => updateBoard({ supplier: event.target.value || null })}
              className={kelasField("supplier")}
              autoComplete="organization"
            />
            {unreadFields.includes("supplier") && (
              <span className="mt-1 block text-xs text-neutral-600">
                Tidak terbaca dari foto. Periksa dan isi bila tahu.
              </span>
            )}
          </label>
          <label>
            <span className="text-sm font-semibold">Nilai kontrak (rupiah)</span>
            <input
              inputMode="numeric"
              value={contractValueInput}
              onChange={(event) => setContractValueInput(event.target.value)}
              onBlur={() => {
                if (contractValue !== null) setContractValueInput(String(contractValue));
              }}
              className={kelasField("contractValue")}
              placeholder="mis. Rp 1.234.567"
            />
            {contractValueInput.trim() !== "" && contractValue === null && (
              <span className="mt-1 block text-xs text-[#D9480F]">
                Nilai tidak dapat dibaca; tulis angka saja.
              </span>
            )}
            {unreadFields.includes("contractValue") && (
              <span className="mt-1 block text-xs text-neutral-600">
                Tidak terbaca dari foto. Periksa dan isi bila tahu.
              </span>
            )}
          </label>
          <label>
            <span className="text-sm font-semibold">Masa pelaksanaan (hari)</span>
            <input
              inputMode="numeric"
              value={board.durationDays ?? ""}
              onChange={(event) =>
                updateBoard({
                  durationDays:
                    event.target.value === "" ? null : Number(event.target.value.replace(/[^\d]/g, "")) || null,
                })
              }
              className={kelasField("durationDays")}
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Tahun anggaran</span>
            <input
              inputMode="numeric"
              value={board.fiscalYear ?? ""}
              onChange={(event) =>
                updateBoard({
                  fiscalYear:
                    event.target.value === "" ? null : Number(event.target.value.replace(/[^\d]/g, "")) || null,
                })
              }
              className={kelasField("fiscalYear")}
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Tanggal kontrak</span>
            <input
              type="date"
              value={board.contractDate ?? ""}
              onChange={(event) => updateBoard({ contractDate: event.target.value || null })}
              className={kelasField("contractDate")}
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Sumber dana</span>
            <input
              value={board.fundingSource ?? ""}
              onChange={(event) => updateBoard({ fundingSource: event.target.value || null })}
              className={kelasField("fundingSource")}
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Satuan kerja</span>
            <input
              value={board.agencyUnit ?? ""}
              onChange={(event) => updateBoard({ agencyUnit: event.target.value || null })}
              className={kelasField("agencyUnit")}
            />
          </label>
          <label>
            <span className="text-sm font-semibold">Nomor kontrak</span>
            <input
              value={board.contractNumber ?? ""}
              onChange={(event) => updateBoard({ contractNumber: event.target.value || null })}
              className={kelasField("contractNumber")}
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-sm font-semibold">Lokasi</span>
            <input
              value={board.locationText ?? ""}
              onChange={(event) => updateBoard({ locationText: event.target.value || null })}
              className={kelasField("locationText")}
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
          disabled={working || !gateTerpenuhi}
          className="mt-5 w-full rounded-md border-2 border-black bg-[#FFC400] px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {working ? "Memproses…" : "Konfirmasi dan cocokkan"}
        </button>
        {!gateTerpenuhi && !working && (
          <p role="status" className="mt-2 text-sm text-neutral-700">
            Belum lengkap: {fieldKurang.join(", ")}. Isi minimal 2 dari 3 field kunci.
          </p>
        )}
      </form>
    </div>
  );
}
