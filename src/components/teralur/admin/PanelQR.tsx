"use client";

import Link from "next/link";
import { useState } from "react";

// PanelQR (T-45 UI, Lampiran L.5): pratinjau QR dari endpoint QR admin, URL
// dossier dengan tombol Salin, Unduh SVG/PNG, Buka lembar cetak. Nilai
// NEXT_PUBLIC_SITE_URL yang dipakai ditampilkan agar tim dapat melihat bila
// masih alamat sementara.

export function PanelQR({
  projectId,
  slug,
  siteUrl,
}: {
  projectId: string;
  slug: string;
  /** Nilai NEXT_PUBLIC_SITE_URL dari server; string kosong bila belum diatur. */
  siteUrl: string;
}) {
  const [tersalin, setTersalin] = useState(false);
  const urlDossier = `${siteUrl || "(alamat situs belum diatur)"}/dossiers/${slug}`;

  async function salin() {
    try {
      await navigator.clipboard.writeText(`${siteUrl}/dossiers/${slug}`);
      setTersalin(true);
      window.setTimeout(() => setTersalin(false), 2000);
    } catch {
      setTersalin(false);
    }
  }

  return (
    // id + scroll-mt: aksi "Lembar QR" di daftar proyek menautkan ke sini.
    <section id="qr" aria-label="QR dossier" className="scroll-mt-24">
      <h2 className="font-heading text-lg font-bold">QR</h2>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* Pratinjau QR (L.5): img dari endpoint svg — next/image tidak dapat
            memuat SVG dari route dinamis tanpa dangerouslyAllowSVG. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/admin/projects/${projectId}/qr?format=svg`}
          alt={`QR kode untuk dossier ${slug}`}
          width={192}
          height={192}
          className="size-48 shrink-0 rounded-lg border-2 border-black bg-white p-2"
        />
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-sm font-semibold">URL dossier</p>
            <p className="mt-1 break-all rounded border border-neutral-300 bg-white px-2 py-1 font-mono text-sm">
              {urlDossier}
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              Alamat situs yang dipakai:{" "}
              <span className="font-mono">{siteUrl || "belum diatur (NEXT_PUBLIC_SITE_URL kosong)"}</span>
              {siteUrl ? "" : " — QR baru dapat dibuat setelah diatur."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void salin()}
              className="inline-flex min-h-11 items-center rounded-md border-2 border-black bg-white px-4 py-2 text-sm font-semibold"
            >
              {tersalin ? "Tersalin." : "Salin"}
            </button>
            <a
              href={`/api/admin/projects/${projectId}/qr?format=svg&download=1`}
              className="inline-flex min-h-11 items-center rounded-md border-2 border-black bg-white px-4 py-2 text-sm font-semibold"
            >
              Unduh SVG
            </a>
            <a
              href={`/api/admin/projects/${projectId}/qr?format=png&download=1`}
              className="inline-flex min-h-11 items-center rounded-md border-2 border-black bg-white px-4 py-2 text-sm font-semibold"
            >
              Unduh PNG
            </a>
            <Link
              href={`/dashboard/proyek/${projectId}/qr`}
              className="inline-flex min-h-11 items-center rounded-md border-2 border-black bg-kuning-papan px-4 py-2 text-sm font-semibold"
            >
              Buka lembar cetak
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
