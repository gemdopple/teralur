// Dataset demo statis untuk peta warga dan dasbor peran (redesign v2).
// Sumber kebenaran: tabel SEEDS scripts/seed-demo.ts (Lampiran M). Tiga hero
// (demo-001/002/004) sudah ada di hero-dossiers.ts; tujuh lainnya ditiru di
// sini dengan pola yang sama. Bila seed diubah, berkas ini wajib diubah.
// Status TIDAK diketik manual: dihitung compare() produksi saat render, sama
// dengan salinan statis hero. Koordinat adalah KOORDINAT SIMULASI untuk kota
// rekaan Kota Tirtamulya (data simulasi — bukan lokasi nyata), disebar di
// sekitar satu pusat agar peta terbaca; proyek di lokasi sama diberi jitter
// deterministik dari kunci agar pin tidak menumpuk.

import { HERO_SPECS, heroDossier, type HeroSpec, type HeroDossier } from "./hero-dossiers";
import type { DossierStatus } from "@/components/teralur/ChipStatus";

export type KategoriProyek = "Pembangunan" | "Rehabilitasi" | "Peningkatan" | "Pemeliharaan";

export type ProyekDemo = {
  kunci: string;
  /** Tautan dossier statis yang selalu hidup (mode cadangan). */
  href: string;
  nama: string;
  penyedia: string | null;
  penyediaPapan: string | null;
  nilaiKontrak: number | null;
  nilaiPapan: number | null;
  masaHari: number | null;
  lokasi: string;
  kategori: KategoriProyek;
  status: DossierStatus;
  lat: number;
  lng: number;
  featured: boolean;
  tahun: number;
  instansi: string;
  sumberDana: string;
  nomorKontrak: string;
};

/** Baris publik dengan koordinat opsional — proyek nyata belum tentu punya pin. */
export type ProyekPublik = Omit<ProyekDemo, "lat" | "lng"> & {
  lat: number | null;
  lng: number | null;
};

/** Pusat kota rekaan Kota Tirtamulya (simulasi) untuk peta warga. */
export const PUSAT_KOTA = { lat: -6.3265, lng: 106.4455, nama: "Kota Tirtamulya (simulasi)" };

// Koordinat simulasi per lokasi seed — nama lokasi rekaan, jadi koordinatnya
// juga rekaan dan berlabel simulasi di antarmuka.
const KOORDINAT_LOKASI: Record<string, { lat: number; lng: number }> = {
  "Kecamatan Sukamaju": { lat: -6.318, lng: 106.437 },
  "Desa Tirtamulya": { lat: -6.334, lng: 106.449 },
  "Desa Sumberlaras": { lat: -6.312, lng: 106.456 },
  Sumberlaras: { lat: -6.312, lng: 106.456 },
  "Desa Cibening Lembah": { lat: -6.342, lng: 106.428 },
  "Ruas Tirtamulya Lembah": { lat: -6.33, lng: 106.461 },
};

// Jitter deterministik ±0.004° (≈400 m) dari hash kunci — pin proyek di lokasi
// yang sama tidak menumpuk dan peta tetap stabil antar render.
function jitter(kunci: string, indeks: number): number {
  let hash = 0;
  for (const karakter of kunci) hash = (hash * 31 + karakter.charCodeAt(0)) % 997;
  return (((hash + indeks * 137) % 17) - 8) * 0.0005;
}

export function kategoriDariNama(nama: string): KategoriProyek {
  if (nama.startsWith("Pemeliharaan")) return "Pemeliharaan";
  if (nama.startsWith("Rehabilitasi")) return "Rehabilitasi";
  if (nama.startsWith("Peningkatan")) return "Peningkatan";
  return "Pembangunan";
}

// Tujuh spesifikasi seed lainnya (demo-003, 005–010) — pola sama dengan
// HERO_SPECS di hero-dossiers.ts (offsetHari = null berarti tanpa tanggal).
export const SPECS_TAMBAHAN: HeroSpec[] = [
  {
    exampleId: "demo-003",
    board: { packageName: "Pembangunan Gedung Puskesmas Pembantu Desa Sumberlaras", supplier: "PT Nagasari Cipta Graha", contractValue: 2_640_000_000, durationDays: 180 },
    official: { packageName: "Pembangunan Gedung Puskesmas Pembantu Desa Sumberlaras", supplier: "PT Nagasari Cipta Graha", contractValue: 2_640_000_000, durationDays: 180 },
    offsetHari: null,
    lokasi: "Desa Sumberlaras",
  },
  {
    exampleId: "demo-005",
    board: { packageName: "Pembangunan Talud Sungai Cikarang Hulu Kecamatan Sukamaju", supplier: "CV Sagara Karya Utama", contractValue: 640_000_000, durationDays: 75 },
    official: { packageName: "Pembangunan Talud Sungai Cikarang Hulu Kecamatan Sukamaju", supplier: "PT Sagara Karya Teknik", contractValue: 640_000_000, durationDays: 75 },
    offsetHari: -30,
    lokasi: "Kecamatan Sukamaju",
  },
  {
    exampleId: "demo-006",
    board: { packageName: "Pembangunan Jembatan Kali Sengon Desa Tirtamulya", supplier: "PT Adhi Pratama Sejahtera", contractValue: 1_980_000_000, durationDays: 100 },
    official: { packageName: "Rehabilitasi Saluran Irigasi Sengon Desa Tirtamulya", supplier: "PT Adhi Pratama Sejahtera", contractValue: 1_980_000_000, durationDays: 100 },
    offsetHari: -60,
    lokasi: "Desa Tirtamulya",
  },
  {
    exampleId: "demo-007",
    board: { packageName: "Rehabilitasi Gedung Sekolah Dasar Negeri 3 Sumberlaras", supplier: "CV Bumi Asri Perkasa", contractValue: 1_250_000_000, durationDays: 120 },
    official: { packageName: "Rehabilitasi Gedung Sekolah Dasar Negeri 3 Sumberlaras", supplier: "PT Cahaya Utama Teknik", contractValue: 1_730_000_000, durationDays: 120 },
    offsetHari: -20,
    lokasi: "Sumberlaras",
  },
  {
    exampleId: "demo-008",
    board: { packageName: "Peningkatan Jalan Lingkungan Mawar Kecamatan Sukamaju", supplier: null, contractValue: null, durationDays: null },
    official: { packageName: "Peningkatan Jalan Lingkungan Mawar Kecamatan Sukamaju", supplier: "PT Rajawali Karya Abadi", contractValue: 780_000_000, durationDays: 60 },
    offsetHari: -15,
    lokasi: "Kecamatan Sukamaju",
  },
  {
    exampleId: "demo-009",
    board: { packageName: "Pembangunan Pagar dan Drainase Pasar Rakyat Sumberlaras", supplier: "PT Nusa Indah Konstruksi", contractValue: 2_310_000_000, durationDays: 60 },
    official: { packageName: "Pembangunan Pagar dan Drainase Pasar Rakyat Sumberlaras", supplier: "PT Nusa Indah Konstruksi", contractValue: 2_305_000_000, durationDays: 60 },
    offsetHari: -20,
    lokasi: "Sumberlaras",
  },
  {
    exampleId: "demo-010",
    board: { packageName: "Pemeliharaan Rutin Jalan Kabupaten Ruas Tirtamulya Lembah", supplier: "CV Tani Makmur Sendaya", contractValue: 450_000_000, durationDays: null },
    official: { packageName: "Pemeliharaan Rutin Jalan Kabupaten Ruas Tirtamulya Lembah", supplier: "CV Tani Makmur Sendaya", contractValue: 450_000_000, durationDays: 150 },
    offsetHari: -10,
    lokasi: "Ruas Tirtamulya Lembah",
  },
];

const UNGGULAN = new Set(["demo-001", "demo-002", "demo-004"]);

export type DossierDemo = HeroDossier & { spec: HeroSpec };

/** Dossier statis lengkap untuk satu kunci seed (status dihitung compare()). */
export function dossierDemo(kunci: string, today: string): DossierDemo | null {
  const spec = SEMUA_SPECS.find((item) => item.exampleId === kunci);
  return spec ? { ...heroDossier(spec, today), spec } : null;
}

const SEMUA_SPECS: HeroSpec[] = [...HERO_SPECS, ...SPECS_TAMBAHAN];

/** Nama paket resmi dari spesifikasi statis (tanpa menghitung tanggal). */
export function namaDemo(kunci: string): string | null {
  return SEMUA_SPECS.find((spec) => spec.exampleId === kunci)?.official.packageName ?? null;
}

/** Semua 10 proyek seed sebagai baris siap-peta (status dihitung saat render). */
export function daftarProyekDemo(today: string): ProyekDemo[] {
  return SEMUA_SPECS.map((spec, indeks) => {
    const dossier = heroDossier(spec, today);
    const dasar = KOORDINAT_LOKASI[spec.lokasi] ?? PUSAT_KOTA;
    return {
      kunci: spec.exampleId,
      href: `/examples/${spec.exampleId}`,
      nama: dossier.packageName,
      penyedia: dossier.record.supplier,
      penyediaPapan: dossier.board.supplier,
      nilaiKontrak: dossier.record.contractValue,
      nilaiPapan: dossier.board.contractValue,
      masaHari: dossier.record.durationDays,
      lokasi: spec.lokasi,
      kategori: kategoriDariNama(dossier.packageName),
      status: dossier.status,
      lat: dasar.lat + jitter(spec.exampleId, indeks),
      lng: dasar.lng + jitter(spec.exampleId, indeks + 3),
      featured: UNGGULAN.has(spec.exampleId),
      tahun: dossier.record.fiscalYear ?? 2026,
      instansi: dossier.record.agencyUnit ?? "Dinas Pekerjaan Umum Kota Tirtamulya",
      sumberDana: dossier.board.fundingSource ?? "APBD 2026",
      nomorKontrak: dossier.board.contractNumber ?? `SIM/${spec.exampleId}/2026`,
    };
  });
}

/**
 * Baris publik (peta warga dan galeri). Tanpa konsep draf, seluruh dataset
 * simulasi tampil; nama lama dipertahankan agar pemanggil tidak berubah.
 */
export function daftarProyekPublik(today: string): ProyekDemo[] {
  return daftarProyekDemo(today);
}

/** Kunci seed yang punya salinan statis lengkap (contoh kasus). */
export const KUNCI_STATIS: string[] = SEMUA_SPECS.map((spec) => spec.exampleId);
