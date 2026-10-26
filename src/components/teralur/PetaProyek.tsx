"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { DossierStatus } from "@/components/teralur/ChipStatus";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Location01Icon,
  ArrowRight01Icon,
  FilterIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import type { ProyekDemo } from "@/data/proyek-demo";
import { cn } from "@/lib/utils";

// Panel peta warga (redesign v2): pencarian teks, filter status, tombol
// "proyek terdekat" (geolokasi perangkat), daftar hasil, dan peta interaktif.
// Peta diimpor dinamis ssr:false (Leaflet butuh window).

const PetaDalam = dynamic(() => import("@/components/teralur/peta-dalam"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center bg-muted/60 text-sm text-muted-foreground">
      Memuat peta…
    </div>
  ),
});

type FilterStatus = "semua" | "cocok" | "selisih" | "lainnya";

const FILTERS: Array<{ nilai: FilterStatus; label: string }> = [
  { nilai: "semua", label: "Semua status" },
  { nilai: "cocok", label: "Cocok" },
  { nilai: "selisih", label: "Selisih" },
  { nilai: "lainnya", label: "Lainnya" },
];

function jarakKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function termasukFilter(status: DossierStatus, filter: FilterStatus): boolean {
  if (filter === "semua") return true;
  if (filter === "cocok") return status === "cocok";
  if (filter === "selisih") return status === "selisih";
  return status !== "cocok" && status !== "selisih";
}

export function PetaProyek({ items }: { items: ProyekDemo[] }) {
  const [kueri, setKueri] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [bukaFilter, setBukaFilter] = useState(false);
  const [posisiSaya, setPosisiSaya] = useState<{ lat: number; lng: number } | null>(null);
  const [terpilih, setTerpilih] = useState<string | null>(null);

  const hasil = useMemo(() => {
    const kata = kueri.trim().toLowerCase();
    const cocok = items.filter((item) => {
      const teks = `${item.nama} ${item.lokasi} ${item.penyedia ?? ""} ${item.kategori}`.toLowerCase();
      return termasukFilter(item.status, filter) && (kata === "" || teks.includes(kata));
    });
    if (!posisiSaya) return cocok;
    return [...cocok].sort(
      (a, b) => jarakKm(posisiSaya, a) - jarakKm(posisiSaya, b),
    );
  }, [items, kueri, filter, posisiSaya]);

  // Default: proyek terdekat — minta lokasi sekali saat panel dibuka; bila
  // ditolak, daftar tetap terurut biasa dan tautan kecil disediakan untuk
  // mencoba lagi (permintaan PM: tanpa tombol besar "Proyek terdekat").
  // Diam sesuai permintaan PM: tanpa pesan status apa pun — berhasil = terurut
  // terdekat (label jarak muncul di kartu), gagal = urutan biasa.
  const cariTerdekat = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((posisi) => {
      setPosisiSaya({ lat: posisi.coords.latitude, lng: posisi.coords.longitude });
    }, undefined, { timeout: 10_000 });
  }, []);

  useEffect(() => {
    cariTerdekat();
  }, [cariTerdekat]);

  const labelJarak = (item: ProyekDemo) =>
    posisiSaya ? `${jarakKm(posisiSaya, item).toFixed(1).replace(".", ",")} km dari Anda` : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
      {/* Panel pencarian + daftar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <HugeiconsIcon
              icon={Search01Icon}
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={kueri}
              onChange={(e) => setKueri(e.target.value)}
              placeholder="Cari nama paket, lokasi, atau penyedia…"
              aria-label="Cari proyek"
              className="rounded-xl border-border bg-card pl-9"
            />
          </div>

          {/* Satu tombol Filter (permintaan PM) — pilihan status dalam dropdown. */}
          <div className="relative shrink-0">
          {bukaFilter && (
            <button
              type="button"
              aria-label="Tutup filter"
              tabIndex={-1}
              onClick={() => setBukaFilter(false)}
              className="fixed inset-0 z-20 cursor-default"
            />
          )}
          <button
            type="button"
            onClick={() => setBukaFilter((v) => !v)}
            aria-expanded={bukaFilter}
            aria-haspopup="listbox"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <HugeiconsIcon icon={FilterIcon} className="size-4" strokeWidth={2} />
            Filter
          </button>
          {bukaFilter && (
            <div
              role="listbox"
              aria-label="Filter status"
              className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-hitam-aspal/15"
            >
              {FILTERS.map((pilihan) => (
                <button
                  key={pilihan.nilai}
                  type="button"
                  role="option"
                  aria-selected={filter === pilihan.nilai}
                  onClick={() => {
                    setFilter(pilihan.nilai);
                    setBukaFilter(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium transition-colors",
                    filter === pilihan.nilai
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  {pilihan.label}
                  {filter === pilihan.nilai && (
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      className="size-4 text-foreground"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
          </div>
        </div>


        <ul className="grid gap-2 lg:max-h-[26rem] lg:overflow-y-auto lg:pr-1">
          {hasil.map((item, index) => (
            <li key={item.kunci}>
              {/* Kartu satu ketukan (permintaan PM): tanpa chip status (cukup
                  filter), seluruh kartu menuju dossier; sentuh/hover menandai
                  penanda peta. */}
              <Link
                href={item.href}
                onMouseEnter={() => setTerpilih(item.kunci)}
                onFocus={() => setTerpilih(item.kunci)}
                style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
                className={cn(
                  "animate-fade-up group block rounded-2xl border bg-card p-4 shadow-sm transition-all active:bg-muted/40",
                  terpilih === item.kunci
                    ? "border-hitam-aspal"
                    : "border-border hover:-translate-y-0.5 hover:shadow-md",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.kategori}
                    </p>
                    <h3 className="mt-1 line-clamp-2 font-heading text-sm font-semibold leading-snug tracking-tight">
                      {item.nama}
                    </h3>
                  </div>
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-hitam-aspal group-hover:text-kertas"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                  </span>
                </div>
                <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                  <HugeiconsIcon icon={Location01Icon} className="size-3.5 shrink-0" />
                  <span className="truncate">{item.lokasi}</span>
                  {labelJarak(item) && (
                    <span className="font-medium text-foreground">· {labelJarak(item)}</span>
                  )}
                </p>
                {item.nilaiKontrak !== null && (
                  <p className="mt-3 flex items-baseline justify-between gap-2 border-t border-border pt-2.5 text-xs">
                    <span className="text-muted-foreground">Nilai kontrak</span>
                    <span className="font-semibold text-foreground">
                      {formatRupiahRingkas(item.nilaiKontrak)}
                    </span>
                  </p>
                )}
              </Link>
            </li>
          ))}
          {hasil.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Belum ada proyek yang cocok dengan pencarian ini. Coba kata kunci lain atau ubah
              filter status.
            </li>
          )}
        </ul>
      </div>

      {/* Peta — di ponsel tampil paling atas sebagai pratinjau (permintaan
          PM: menggantikan seksi teks pemindai), di layar lebar tetap di kanan. */}
      <div className="relative order-first h-[24rem] overflow-hidden rounded-2xl border border-border bg-muted/40 lg:order-none lg:h-[38rem]">
        <PetaDalam items={hasil} selectedKey={terpilih} />
        <p className="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-full bg-card/90 px-2.5 py-1 text-[10px] text-muted-foreground">
          Peta © OpenStreetMap
        </p>
      </div>
    </div>
  );
}
