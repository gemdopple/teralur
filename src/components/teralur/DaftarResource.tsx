"use client";

import Image from "next/image";
import { useState } from "react";
import { formatTanggal } from "@/lib/dates";

// DaftarResource (G.3 pengecualian + F-16): setiap resource menampilkan judul,
// tanggal unggah (formatTanggal), tulisan "Diunggah pengelola", dan lencana
// SIMULASI bila proyek demo. Foto memakai next/image dengan ukuran terbatas;
// PDF berupa tautan ikon. Resource terbuka di tab baru. Bila objek sudah
// tidak tersimpan di Storage (N.3), foto ditampilkan tanpa gambar — judul tetap
// terbaca (ditangani lewat onError gambar).

export type ResourcePublik = {
  id: string;
  kind: "photo" | "document";
  title: string;
  url: string;
  /** ISO timestamptz dari server. */
  createdAt: string;
};

function LencanaSimulasi() {
  return (
    <span className="inline-flex rounded border border-black bg-hitam-aspal px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-kuning-papan">
      SIMULASI
    </span>
  );
}

function ItemResource({ resource, demo }: { resource: ResourcePublik; demo: boolean }) {
  const [gambarGagal, setGambarGagal] = useState(false);
  const tanggal = formatTanggal(resource.createdAt.slice(0, 10));
  const gambarTampil = resource.kind === "photo" && !gambarGagal;

  return (
    <li className="rounded-xl border border-neutral-300 bg-white p-3">
      {resource.kind === "photo" ? (
        gambarTampil ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-neutral-200"
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
            className="flex h-28 w-full max-w-md items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-100 text-sm text-neutral-600"
          >
            Gambar tidak dapat ditampilkan
          </div>
        )
      ) : (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border-2 border-black px-3 py-2 text-sm font-semibold"
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
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-700">
        <span>{tanggal}</span>
        <span aria-hidden="true">·</span>
        <span>Diunggah pengelola</span>
        {demo ? (
          <>
            <span aria-hidden="true">·</span>
            <LencanaSimulasi />
          </>
        ) : null}
      </p>
    </li>
  );
}

export function DaftarResource({
  resources,
  demo,
}: {
  resources: ResourcePublik[];
  demo: boolean;
}) {
  if (resources.length === 0) return null;
  return (
    <section aria-label="Resource">
      <h2 className="font-heading text-xl font-bold">Resource</h2>
      <p className="mt-1 text-sm text-neutral-700">
        Foto dan dokumen yang diunggah pengelola proyek.{" "}
        {demo ? <LencanaSimulasi /> : null}
      </p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {resources.map((resource) => (
          <ItemResource key={resource.id} resource={resource} demo={demo} />
        ))}
      </ul>
    </section>
  );
}
