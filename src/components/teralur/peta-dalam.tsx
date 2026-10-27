"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ProyekDemo } from "@/data/proyek-demo";
import { PUSAT_KOTA } from "@/data/proyek-demo";
import { formatRupiahRingkas } from "@/lib/format-rupiah";
import { ChipStatus } from "@/components/teralur/ChipStatus";
import Link from "next/link";

// Peta dalam (client-only): react-leaflet + ubin OpenStreetMap.
// Diimpor dinamis dengan ssr:false dari PetaProyek agar Leaflet tidak dievaluasi
// di server. Pin memakai divIcon BULAT (bingkai putih 2-3px, bayangan halus)
// berwarna status; proyek terpilih lebih besar dengan cincin garis luar.

const WARNA_PIN: Record<string, string> = {
  cocok: "#1F8A5B",
  selisih: "#D9480F",
  tidak_ditemukan: "#6B6F76",
  catatan_resmi: "#6B6F76",
};

function buatPin(status: string, terpilih: boolean): L.DivIcon {
  const warna = WARNA_PIN[status] ?? WARNA_PIN.tidak_ditemukan;
  const ukuran = terpilih ? 20 : 16;
  return L.divIcon({
    className: "teralur-pin",
    html: `<span style="display:block;width:${ukuran}px;height:${ukuran}px;background:${warna};border:${terpilih ? 3 : 2}px solid #FFFFFF;border-radius:9999px;box-shadow:0 1px 4px rgb(20 17 15 / 25%);${
      terpilih ? "outline:2px solid rgb(27 25 23 / 35%);outline-offset:2px;" : ""
    }"></span>`,
    iconSize: [ukuran, ukuran],
    iconAnchor: [ukuran / 2, ukuran / 2],
    popupAnchor: [0, -ukuran / 2],
  });
}

function TerbangKe({ target }: { target: ProyekDemo | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
    }
  }, [target, map]);
  return null;
}

// CekHidup: deteksi peta mati saat pohon halaman yang di-cache router
// diaktifkan kembali (pengguna pergi lalu kembali ke /jelajah). Saat
// deaktivasi, react-leaflet menghancurkan peta (map.remove() menghapus
// _leaflet_id dari kontainer); saat reaktivasi, React menjalankan ulang efek
// komponen-komponen dalam MapContainer terhadap instance peta yang sudah
// mati — TileLayer menambah layer ke peta mati dan Leaflet crash dengan
// "Cannot read properties of undefined (reading 'appendChild')".
//
// Komponen ini sengaja menjadi ANAK PERTAMA MapContainer: efeknya berjalan
// lebih dulu daripada efek TileLayer/Marker pada setiap aktivasi, sehingga
// bisa menandai peta mati dan memicu pemasangan ulang peta yang segar
// (kunci baru di PetaProyek) sebelum crash terjadi. Pemeriksaan membandingkan
// _containerId peta dengan _leaflet_id yang tersisa di kontainer — sama dengan
// syarat yang membuat Map.remove() melempar "Map container is being reused".
function CekHidup({ onMati }: { onMati: () => void }) {
  const map = useMap();
  useEffect(() => {
    const idKontainer = (map.getContainer() as (HTMLElement & { _leaflet_id?: number }) | null)?._leaflet_id;
    if (idKontainer !== (map as unknown as { _containerId?: number })._containerId) {
      onMati();
    }
  });
  return null;
}

// Rapikan sebelum bongkar: efek cleanup komponen ANAK berjalan lebih dulu
// daripada cleanup MapContainer (yang memanggil map.remove()). Tanpa langkah
// ini, navigasi cepat keluar-masuk /jelajah memicu dua error Leaflet:
//
//  1. "Cannot read properties of undefined (reading 'appendChild')" —
//     Map.addLayer menunda pemasangan layer lewat whenReady sampai peta siap;
//     bila map.remove() berjalan lebih dulu, _layerAdd yang tertunda menembak
//     pada peta yang sudah dibongkar (tilePane sudah tidak ada).
//  2. "Map container is being reused by another instance" — dilempar dari
//     map.remove() itu sendiri pada peta yang rusak setengah jalan, sehingga
//     kontainer tidak sempat dibersihkan.
//
// Melepas semua layer dan menghentikan animasi SEBELUM map.remove() membuat
// kedua jalur tersebut tidak pernah terjadi. try/catch: bila peta memang sudah
// dalam keadaan rusak, biarkan React membersihkan sisanya tanpa melempar lagi.
function RapikanSebelumBongkar() {
  const map = useMap();
  useEffect(() => {
    return () => {
      try {
        map.stop();
        map.eachLayer((layer) => {
          map.removeLayer(layer);
        });
      } catch {
        // Peta sudah tidak beroperasi — abaikan.
      }
    };
  }, [map]);
  return null;
}

export default function PetaDalam({
  items,
  selectedKey,
  onMati,
}: {
  items: ProyekDemo[];
  selectedKey: string | null;
  onMati?: () => void;
}) {
  const terpilih = items.find((item) => item.kunci === selectedKey) ?? null;

  return (
    <MapContainer
      center={[PUSAT_KOTA.lat, PUSAT_KOTA.lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="z-0 h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onMati && <CekHidup onMati={onMati} />}
      <RapikanSebelumBongkar />
      <TerbangKe target={terpilih} />
      {items.map((item) => (
        <Marker
          key={item.kunci}
          position={[item.lat, item.lng]}
          icon={buatPin(item.status, item.kunci === selectedKey)}
          zIndexOffset={item.kunci === selectedKey ? 1000 : 0}
        >
          <Popup>
            {/* Isi popup membulat (rounded-xl) dengan gaya kartu bersih. */}
            <div className="min-w-52 space-y-2 rounded-xl bg-card p-1">
              <ChipStatus status={item.status} />
              <p className="text-sm font-semibold leading-snug">{item.nama}</p>
              <p className="text-xs text-muted-foreground">
                {item.lokasi} · {item.kategori}
              </p>
              {item.nilaiKontrak !== null && (
                <p className="text-xs text-muted-foreground">
                  Nilai kontrak: <strong className="font-mono">{formatRupiahRingkas(item.nilaiKontrak)}</strong>
                </p>
              )}
              <Link
                href={item.href}
                className="mt-1 inline-block rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Buka laporan lengkap
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
