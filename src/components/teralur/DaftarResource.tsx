"use client";

import Image from "next/image";
import { useState } from "react";
import { formatTanggal } from "@/lib/dates";

// DaftarResource (G.3 pengecualian + F-16): setiap resource menampilkan judul,
// tanggal unggah (formatTanggal), tulisan "Diunggah pengelola", dan lencana
// SIMULASI bila proyek demo. Foto memakai next/image dengan ukuran terbatas;
// PDF berupa tautan ikon. Resource terbuka di tab baru. Bila objek sudah
// tidak tersimpan di Storage (N.3), foto ditampilkan tanpa gambar — judul tetap
// terbaca (ditangani lewat onError gambar). Gaya modern: kartu rounded-lg
// dengan bayangan lembut dan angkat kecil saat hover.

export type ResourcePublik = {
  id: string;
  kind: "photo" | "document";
  title: string;
  url: string;
  /** ISO timestamptz dari server. */
  createdAt: string;
};


function ItemResource({ resource }: { resource: ResourcePublik }) {
  const [gambarGagal, setGambarGagal] = useState(false);
  const tanggal = formatTanggal(resource.createdAt.slice(0, 10));
  const gambarTampil = resource.kind === "photo" && !gambarGagal;

  return (
    <li className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/30">
      {resource.kind === "photo" ? (
        gambarTampil ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-border"
          >
            <Image
              src={resource.url}
              alt={resource.title}
              width={640}
              height={400}
              unoptimized
              sizes="(min-width: 768px) 480px, 100vw"
              className="h-auto w-full max-w-md object-cover"
              onError={() => setGambarGagal(true)}
            />
          </a>
        ) : (
          <div
            aria-hidden="true"
            className="flex h-28 w-full max-w-md items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 text-sm text-muted-foreground"
          >
            Gambar tidak dapat ditampilkan
          </div>
        )
      ) : (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
        >
          <span aria-hidden="true" className="text-lg">
            📄
          </span>
          Buka PDF
        </a>
      )}

      <p className="mt-2 break-words font-semibold leading-snug">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline"
        >
          {resource.title}
        </a>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>{tanggal}</span>
        <span aria-hidden="true">·</span>
        <span>Diunggah pengelola</span>
      </p>
    </li>
  );
}

export function DaftarResource({
  resources,
}: {
  resources: ResourcePublik[];
  demo?: boolean;
}) {
  if (resources.length === 0) return null;
  return (
    <section aria-label="Resource">
      <h2 className="font-heading text-xl font-semibold tracking-tight">Resource</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Foto dan dokumen yang diunggah pengelola proyek.{" "}
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {resources.map((resource) => (
          <ItemResource key={resource.id} resource={resource} />
        ))}
      </ul>
    </section>
  );
}
