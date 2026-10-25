"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { ChipStatus, type DossierStatus } from "@/components/teralur/ChipStatus";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, PinLocation01Icon, Loading03Icon, ArrowUpRightIcon } from "@hugeicons/core-free-icons";
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
  const [posisiSaya, setPosisiSaya] = useState<{ lat: number; lng: number } | null>(null);
  const [mencariLokasi, setMencariLokasi] = useState(false);
  const [galatLokasi, setGalatLokasi] = useState<string | null>(null);
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

  function cariTerdekat() {
    setGalatLokasi(null);
    if (!("geolocation" in navigator)) {
      setGalatLokasi("Perangkat Anda belum mendukung deteksi lokasi.");
      return;
    }
    setMencariLokasi(true);
    navigator.geolocation.getCurrentPosition(
      (posisi) => {
        setPosisiSaya({ lat: posisi.coords.latitude, lng: posisi.coords.longitude });
        setMencariLokasi(false);
      },
      () => {
        setGalatLokasi("Izin lokasi ditolak. Anda tetap bisa mencari lewat nama atau lokasi.");
        setMencariLokasi(false);
      },
      { timeout: 10_000 },
    );
  }

  const labelJarak = (item: ProyekDemo) =>
    posisiSaya ? `${jarakKm(posisiSaya, item).toFixed(1).replace(".", ",")} km dari Anda` : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
      {/* Panel pencarian + daftar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
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

        {/* Chip filter pil; aktif = latar tinta dengan teks kertas. */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter status">
          {FILTERS.map((pilihan) => (
            <button
              key={pilihan.nilai}
              type="button"
              onClick={() => setFilter(pilihan.nilai)}
              aria-pressed={filter === pilihan.nilai}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === pilihan.nilai
                  ? "border-hitam-aspal bg-hitam-aspal text-kertas"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {pilihan.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={cariTerdekat}
          disabled={mencariLokasi}
          className={cn(buttonVariants({ variant: posisiSaya ? "secondary" : "default" }), "w-full")}
        >
          <HugeiconsIcon
            icon={mencariLokasi ? Loading03Icon : PinLocation01Icon}
            data-icon="inline-start"
            className={cn(mencariLokasi && "animate-spin")}
          />
          {posisiSaya ? "Perbarui lokasi saya" : "Proyek terdekat dari saya"}
        </button>
        {galatLokasi && (
          <p role="alert" className="text-xs leading-5 text-muted-foreground">
            {galatLokasi}
          </p>
        )}
        {posisiSaya && (
          <p className="text-xs text-muted-foreground">
            Menampilkan hasil terdekat dari lokasi Anda (jarak garis lurus).
          </p>
        )}

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {hasil.length} proyek ditemukan
        </p>

        <ul className="grid gap-2 lg:max-h-[26rem] lg:overflow-y-auto lg:pr-1">
          {hasil.map((item, index) => (
            <li key={item.kunci}>
              {/* Kartu daftar lembut; terpilih ditandai bingkai tinta. */}
              <article
                style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
                className={cn(
                  "animate-fade-up rounded-2xl border bg-card p-4 shadow-sm transition-all",
                  terpilih === item.kunci
                    ? "border-hitam-aspal"
                    : "border-border hover:-translate-y-0.5 hover:shadow-md",
                )}
              >
                <button
                  type="button"
                  onClick={() => setTerpilih(item.kunci)}
                  className="w-full text-left"
                  aria-label={`Tampilkan ${item.nama} pada peta`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <ChipStatus status={item.status} />
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      {item.kategori}
                    </span>
                  </div>
                  <h3 className="mt-2.5 font-heading text-sm font-semibold leading-snug tracking-tight">
                    {item.nama}
                  </h3>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{item.lokasi}</span>
                    {labelJarak(item) && (
                      <span className="font-medium text-foreground">· {labelJarak(item)}</span>
                    )}
                  </p>
                  {item.nilaiKontrak !== null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Nilai kontrak:{" "}
                      <span className="font-mono font-medium text-foreground">
                        {formatRupiahRingkas(item.nilaiKontrak)}
                      </span>
                    </p>
                  )}
                </button>
                <Link
                  href={item.href}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  Buka laporan lengkap
                  <HugeiconsIcon icon={ArrowUpRightIcon} className="size-3.5" />
                </Link>
              </article>
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

      {/* Peta */}
      <div className="relative h-[24rem] overflow-hidden rounded-2xl border border-border bg-muted/40 lg:h-[38rem]">
        <PetaDalam items={hasil} selectedKey={terpilih} />
        <p className="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-full bg-card/90 px-2.5 py-1 text-[10px] text-muted-foreground">
          Peta © OpenStreetMap
        </p>
      </div>
    </div>
  );
}
