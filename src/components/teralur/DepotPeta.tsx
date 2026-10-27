"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useCallback, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import type { ProyekDemo } from "@/data/proyek-demo";

// DepotPeta: peta persisten untuk halaman publik /jelajah.
//
// Kenapa peta tidak dirender langsung di dalam halaman: peta Leaflet di dalam
// pohon rute akan dihancurkan saat pengguna menavigasi pergi, dan router
// Next.js meng-cache pohon halaman lalu mengaktifkannya kembali saat pengguna
// kembali — efek layer berjalan ulang terhadap instance peta yang sudah mati
// dan Leaflet crash ("appendChild of undefined", "Map container is being
// reused"). Semua usaha memulihkan lewat error boundary kalah cepat dari
// siklus cache tersebut.
//
// Solusinya: peta dipasang SEKALI ke dalam node host yang dimiliki komponen
// ini (yang hidup di layout situs — tidak pernah dibongkar antar-navigasi),
// lalu node host DIPINDAHKAN secara fisik ke slot #slot-peta milik halaman
// saat /jelajah terbuka, dan kembali ke rumahnya (tersembunyi di layout) saat
// halaman lain terbuka. React tetap memilikinya; bila React memindahkannya
// pulang pada render ulang, loop rekonsiliasi di bawah membawanya kembali ke
// slot. Dengan demikian tidak ada pemasangan/pembongkaran MapContainer sama
// sekali selama sesi — seluruh keluarga bug ini mustahil terjadi.
//
// Pemuatan modul peta: sengaja TANPA next/dynamic(ssr:false). Validasi
// navigasi-instant (dev, cacheComponents) merender segmen di sisi server;
// dynamic ssr:false melempar sinyal BailoutToCSR di sana dan validasi
// melaporkannya sebagai "an error prevented the target segment from
// rendering". Sebagai gantinya: modul diimpor dengan import() biasa di dalam
// efek, setelah slot /jelajah pertama kali terlihat — tidak ada jejak peta
// pada render server mana pun, dan Leaflet benar-benar lazy (ubin tidak
// diambil di halaman lain).

type PropsPetaDalam = {
  items: ProyekDemo[];
  selectedKey: string | null;
  onMati?: () => void;
};

// ---- Simpanan kondisi peta (hasil filter + kartu terpilih) ----------------

type KondisiPeta = { hasil: ProyekDemo[]; terpilih: string | null };

let kondisiPeta: KondisiPeta = { hasil: [], terpilih: null };
const pelangganPeta = new Set<() => void>();

/** Dipanggil PetaProyek (mode depot) setiap hasil filter berubah. */
export function setKondisiPeta(sebagian: Partial<KondisiPeta>) {
  kondisiPeta = { ...kondisiPeta, ...sebagian };
  pelangganPeta.forEach((f) => f());
}

function berlanggananPeta(f: () => void) {
  pelangganPeta.add(f);
  return () => {
    pelangganPeta.delete(f);
  };
}

function ambilKondisiPeta() {
  return kondisiPeta;
}

// Prarender server tidak berlangganan apa pun; kembalikan kondisi awal.
function ambilKondisiPetaServer() {
  return kondisiPeta;
}

const GAYA_SLOT = "position:absolute;inset:0;";

export function DepotPeta() {
  const pathname = usePathname();
  const diJelajah = pathname === "/jelajah";
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [aktif, setAktif] = useState(false);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rumahRef = useRef<HTMLDivElement | null>(null);
  const { hasil, terpilih } = useSyncExternalStore(
    berlanggananPeta,
    ambilKondisiPeta,
    ambilKondisiPetaServer,
  );

  // Portal butuh node host yang sudah ada di DOM setelah mount pertama.
  // Host disimpan di ref untuk operasi DOM imperatif, dan di state agar portal
  // tahu kapan menempel (ref dibaca saat render oleh portal tidak — portal
  // bergantung pada state host).
  useEffect(() => {
    const el = document.createElement("div");
    el.style.cssText = "position:absolute;left:-99999px;top:0;width:900px;height:600px;";
    rumahRef.current?.appendChild(el);
    hostRef.current = el;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronisasi dengan sistem eksternal (node DOM imperatif)
    setHost(el);
    return () => {
      el.remove();
      hostRef.current = null;
      setHost(null);
    };
  }, []);

  // Muat modul peta di klien saja, setelah slot pertama kali terlihat. Tidak
  // ada next/dynamic di sini — lihat catatan BailoutToCSR di atas.
  const [modulPeta, setModulPeta] = useState<ComponentType<PropsPetaDalam> | null>(null);
  useEffect(() => {
    if (!aktif || modulPeta) return;
    let hidup = true;
    import("@/components/teralur/peta-dalam")
      .then((m) => {
        if (hidup) setModulPeta(() => m.default);
      })
      .catch(() => {
        // Chunk gagal dimuat (jaringan) — CekHidup/aturUlang tidak berlaku di
        // sini; peta tinggal tidak tampil, slot tetap terisi pesan pemuat.
      });
    return () => {
      hidup = false;
    };
  }, [aktif, modulPeta]);

  // Rekonsiliasi posisi host: di dalam slot saat /jelajah terbuka, di rumah
  // (tersembunyi) saat tidak. Interval memastikan pemulihan otomatis bila
  // React memindahkan node pulang pada render ulang, dan menghindari balapan
  // dengan waktu hidrasi halaman (slot milik halaman bisa muncul belakangan).
  // Portal peta baru dirender setelah slot pertama kali terlihat (aktif) —
  // peta tidak dimuat sama sekali di halaman lain (ubin OSM tidak diambil).
  //
  // PINDAH PERTAMA HARUS MENUNGGU HIDRASI: memasukkan host ke slot sebelum
  // segmen halaman selesai hidrasi membuat React melihat DOM yang tidak ada
  // di HTML server — "Recoverable Error: client/server diff" pada
  // PetaProyek. Gerbang: document.readyState complete + jeda 500 ms dari
  // mount; pindahan berikutnya (navigasi balik) tidak perlu gerbang.
  const gerbangHidrasi = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      gerbangHidrasi.current = true;
    }, 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const pindahkan = () => {
      const host = hostRef.current;
      const rumah = rumahRef.current;
      if (!host || !rumah) return;
      const slot = document.getElementById("slot-peta");
      if (slot) {
        if (!gerbangHidrasi.current) return;
        if (!aktif) {
          setAktif(true);
        }
        if (host.parentElement !== slot) {
          slot.appendChild(host);
          host.style.cssText = GAYA_SLOT;
          // Leaflet menghitung ulang ukuran saat event resize window.
          setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
        }
      } else if (host.parentElement !== rumah) {
        rumah.insertBefore(host, rumah.firstChild);
        host.style.cssText = "position:absolute;left:-99999px;top:0;width:900px;height:600px;";
        setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
      }
    };
    pindahkan();
    const id = setInterval(pindahkan, 200);
    return () => clearInterval(id);
  }, [diJelajah, aktif]);

  // Jika suatu saat peta persisten mati (seharusnya tidak pernah — ia tidak
  // pernah dibongkar), pasang ulang dengan kunci baru.
  const [generasi, setGenerasi] = useState(0);
  const hidupkanUlang = useCallback(() => setGenerasi((g) => g + 1), []);
  const ModulPeta = modulPeta;

  return (
    <div
      ref={rumahRef}
      aria-hidden
      // Wadah rumah: tidak mengambil ruang; host di dalamnya tersembunyi
      // lewat gayanya sendiri saat berada di rumah.
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      {aktif &&
        host &&
        ModulPeta &&
        createPortal(
          <ModulPeta key={generasi} items={hasil} selectedKey={terpilih} onMati={hidupkanUlang} />,
          host,
        )}
    </div>
  );
}
