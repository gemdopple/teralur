"use client";

import { useCallback, useEffect, useMemo, useState, Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DossierStatus } from "@/components/teralur/ChipStatus";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Location01Icon,
  ArrowRight01Icon,
  FilterIcon,
} from "@hugeicons/core-free-icons";
import type { ProyekDemo } from "@/data/proyek-demo";
import { daftarProyekPublik } from "@/data/proyek-demo";
import { jakartaToday } from "@/lib/dates";
import { setKondisiPeta } from "@/components/teralur/DepotPeta";
import { cn } from "@/lib/utils";

// Panel peta warga (redesign v2): pencarian teks, filter status, tombol
// "proyek terdekat" (geolokasi perangkat), daftar hasil, dan peta interaktif.
// Peta diimpor dinamis ssr:false (Leaflet butuh window).

// PetaProyekPublik: varian untuk halaman publik /jelajah. Dataset demo dihitung
// di klien setelah mount (butuh tanggal hari ini WIB untuk menghitung status,
// dan `new Date()` tidak boleh berjalan saat prerender), sehingga halaman bisa
// diprarender penuh menjadi static shell — navigasi dari beranda menjadi
// instan. Peta sendiri persisten di DepotPeta (di luar pohon rute — lihat
// catatan di sana); komponen ini menyediakan slot dan mengirim hasil filter.
export function PetaProyekPublik() {
  const [items, setItems] = useState<ProyekDemo[]>([]);

  useEffect(() => {
    // Sengaja setState dalam efek: tanggal hari ini (WIB) dibutuhkan menghitung
    // status, dan `new Date()` tidak boleh dipanggil saat render/prerender.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(daftarProyekPublik(jakartaToday()));
  }, []);

  return <PetaProyek items={items} mode="depot" />;
}

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

// Penghitung pemasangan peta: setiap instance PetaProyek memberi PetaDalam
// key yang unik lintas pemasangan tetapi stabil sepanjang hidup instance.
// Alasan: MapContainer (react-leaflet) menandai <div> kontainer dengan
// _leaflet_id milik peta Leaflet dan melempar "Map container is being reused
// by another instance" bila dua peta mengaku kontainer yang sama, lalu
// Leaflet crash dengan "appendChild of undefined" saat ubin berjalan pada
// peta yang sudah dibongkar. Key baru per pemasangan menjamin React menyediakan
// elemen kontainer segar yang belum pernah disentuh Leaflet.
let HITUNG_PETA = 0;

// BatasPeta: pengaman untuk peta yang dirender di dalam pohon rute (mode
// dasbor). Peta Leaflet bisa crash ketika router mengaktifkan kembali pohon
// halaman yang di-cache; tanpa batas ini error tersebut menjatuhkan seluruh
// halaman. Batas menangkap error fase mount lalu memasang ulang subtree peta
// pada elemen kontainer segar (kunci naik) — pulih tanpa reload. Anggaran
// pemulihan di-refresh bila crash terjadi jauh setelah sebelumnya (peta sempat
// bekerja normal). Halaman /jelajah tidak memakai jalur ini sama sekali —
// peta publik persisten di DepotPeta, di luar pohon rute.
class BatasPeta extends Component<
  { children: ReactNode; darurat: (cobaLagi: () => void) => ReactNode },
  { galat: boolean; generasi: number }
> {
  state = { galat: false, generasi: 0 };
  waktuPemulihan: ReturnType<typeof setTimeout> | null = null;
  waktuGalatTerakhir = 0;
  // Anggaran pemulihan dipisah dari state: hanya berubah di efek/timeout,
  // bukan sinyal render.
  anggaranRef = { sisa: 3 };

  static getDerivedStateFromError() {
    return { galat: true };
  }

  componentDidCatch() {
    const kini = Date.now();
    if (kini - this.waktuGalatTerakhir > 10_000) {
      this.anggaranRef.sisa = 3;
    }
    this.waktuGalatTerakhir = kini;
    if (this.anggaranRef.sisa > 0) {
      this.anggaranRef.sisa -= 1;
      if (this.waktuPemulihan) clearTimeout(this.waktuPemulihan);
      this.waktuPemulihan = setTimeout(() => {
        if (!this.state.galat) return;
        this.setState((s) => ({ galat: false, generasi: s.generasi + 1 }));
      }, 400);
    }
  }

  componentWillUnmount() {
    if (this.waktuPemulihan) clearTimeout(this.waktuPemulihan);
  }

  aturUlang = () => {
    if (this.waktuPemulihan) clearTimeout(this.waktuPemulihan);
    this.anggaranRef.sisa = 3;
    this.setState({ galat: false, generasi: 0 });
  };

  render() {
    if (this.state.galat) {
      return this.props.darurat(this.aturUlang);
    }
    return <div key={this.state.generasi} className="h-full w-full">{this.props.children}</div>;
  }
}

export function PetaProyek({
  items,
  mode = "lokal",
}: {
  items: ProyekDemo[];
  /** "depot": peta persisten di DepotPeta (halaman publik /jelajah) — komponen
   *  ini hanya menyediakan slot dan mengirim hasil filter lewat simpanan.
   *  "lokal": peta dirender langsung di sini (dasbor). */
  mode?: "depot" | "lokal";
}) {
  const [kueri, setKueri] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("semua");
  const [posisiSaya, setPosisiSaya] = useState<{ lat: number; lng: number } | null>(null);
  const [terpilih, setTerpilih] = useState<string | null>(null);
  // Kunci peta: naik saat peta terdeteksi mati (lihat CekHidup di
  // peta-dalam.tsx) sehingga seluruh subtree MapContainer dipasang ulang pada
  // elemen kontainer segar. Stabil antar-render biasa agar peta tidak pernah
  // dipasang ulang tanpa alasan.
  const [kunciPeta, setKunciPeta] = useState(() => `peta-${++HITUNG_PETA}`);
  const hidupkanUlangPeta = useCallback(() => {
    setKunciPeta(`peta-${++HITUNG_PETA}`);
  }, []);

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

  // Mode depot: kirim hasil filter dan kartu terpilih ke peta persisten
  // (DepotPeta) lewat simpanan eksternal.
  useEffect(() => {
    if (mode === "depot") {
      setKondisiPeta({ hasil, terpilih });
    }
  }, [mode, hasil, terpilih]);

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
              className="border-border bg-card pl-9"
            />
          </div>

          {/* Satu tombol Filter (permintaan PM) — primitif ui/select, sama
              dengan bilah saring dasbor. Kuning saat saringan aktif agar
              pengguna melihat daftar tersaring. */}
          <Select
            selectedKey={filter}
            onSelectionChange={(kunci) => setFilter(kunci as FilterStatus)}
          >
            <SelectTrigger
              aria-label="Saring status"
              className={cn(
                "w-36 px-3",
                filter !== "semua" &&
                  "border-transparent! bg-kuning-papan! text-hitam-aspal! hover:bg-kuning-papan/90! hover:text-hitam-aspal! aria-expanded:bg-kuning-papan! aria-expanded:text-hitam-aspal!",
              )}
            >
              <HugeiconsIcon icon={FilterIcon} className="size-4" strokeWidth={2} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((pilihan) => (
                <SelectItem key={pilihan.nilai} id={pilihan.nilai}>
                  {pilihan.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        {/* Daftar mengalir bersama halaman di layar lebar: kartu hasil tidak
            lagi tersembunyi di dalam kotak gulir 26rem di samping peta. */}
        <ul className="grid gap-2 lg:pr-1">
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
                  "animate-fade-up group block rounded-lg border bg-card p-4 transition-colors active:bg-muted/40",
                  terpilih === item.kunci
                    ? "border-hitam-aspal"
                    : "border-border hover:border-foreground/30",
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
            <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Belum ada proyek yang cocok dengan pencarian ini. Coba kata kunci lain atau ubah
              filter status.
            </li>
          )}
        </ul>
      </div>

      {/* Peta — di ponsel tampil paling atas sebagai pratinjau (permintaan
          PM: menggantikan seksi teks pemindai), di layar lebar tetap di kanan
          dan menempel saat daftar hasil digulir.

          Mode depot (halaman publik): hanya slot kosong — node peta persisten
          dari DepotPeta dipindahkan ke dalamnya. Mode lokal (dasbor): peta
          dirender di sini, dibungkus BatasPeta. */}
      <div className="relative order-first h-[24rem] overflow-hidden rounded-lg border border-border bg-muted/40 lg:sticky lg:top-20 lg:order-none lg:h-[38rem]">
        {mode === "depot" ? (
          <div id="slot-peta" className="relative h-full w-full" />
        ) : (
          <BatasPeta darurat={KerangkaDaruratPeta}>
            <PetaDalam key={kunciPeta} items={hasil} selectedKey={terpilih} onMati={hidupkanUlangPeta} />
          </BatasPeta>
        )}
        <p className="pointer-events-none absolute bottom-2 left-2 z-[500] rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-medium text-foreground">
          Peta © OpenStreetMap
        </p>
      </div>
    </div>
  );
}

// Darurat bila peta gagal dipasang berulang kali: pesan + tombol coba lagi.
function KerangkaDaruratPeta(cobaLagi: () => void) {
  return (
    <div className="grid h-full w-full place-items-center bg-muted/60 p-6 text-center">
      <div>
        <p className="text-sm font-medium text-foreground">Peta gagal dimuat.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Peramban mungkin kehabisan memori atau koneksi ubin terganggu.
        </p>
        <button
          type="button"
          onClick={cobaLagi}
          className="mt-3 inline-flex min-h-10 items-center rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}
