import { describe, expect, it } from "vitest";
import { FieldKunciKurang, match } from "./match";
import type { Papan, RecordResmi } from "./types";

const papanDasar: Papan = {
  nama_paket: "Pekerjaan Rehabilitasi Jalan Desa Sukamaju",
  penyedia: "PT Bangun Jaya",
  nilai_kontrak: 150_000_000,
  masa_hari: 120,
  tahun_anggaran: 2026,
  sumber_dana: "DAK",
  satuan_kerja: "DPUPR",
  nomor_kontrak: "123/DPUPR/2026",
  tanggal_kontrak: "2026-07-11",
  lokasi_teks: "Desa Sukamaju, Kec. Sukamaju",
};

const recordDasar: RecordResmi = {
  id: "r1",
  nama_paket: "Rehabilitasi Jalan Desa Sukamaju",
  penyedia: "PT Bangun Jaya",
  nilai_kontrak: 150_000_000,
  tanggal_kontrak: "2026-07-11",
  masa_hari: 120,
  tahun: 2026,
};

describe("match", () => {
  it("cocok ketika ketiga field yang dinilai lulus", () => {
    const hasil = match(papanDasar, [recordDasar]);
    expect(hasil.status).toBe("cocok");
    expect(hasil.terbaik?.id).toBe("r1");
    expect(hasil.skor).toBeCloseTo(1);
    expect(hasil.perluPilih).toBe(false);
    expect(hasil.daftar[0]?.selisih).toEqual([]);
  });

  it("selisih ketika hanya nilai yang gagal", () => {
    const papan: Papan = { ...papanDasar, nilai_kontrak: 157_500_000 }; // +5%
    const hasil = match(papan, [recordDasar]);
    expect(hasil.status).toBe("selisih");
    expect(hasil.daftar[0]?.selisih).toEqual(["nilai_kontrak"]);
    expect(hasil.daftar[0]?.lulus).toEqual({ penyedia: true, nama: true, nilai: false });
  });

  it("tidak_ditemukan ketika hanya satu field yang lulus", () => {
    const papan: Papan = {
      ...papanDasar,
      nama_paket: "Pembangunan Gedung Sekolah Desa Sukamaju", // mirip rendah, gagal < 0.60
      penyedia: "CV Bangun Jaya Perkasa", // mirip 0.59, gagal < 0.85
    };
    const hasil = match(papan, [recordDasar]);
    expect(hasil.status).toBe("tidak_ditemukan");
    expect(hasil.daftar.length).toBeGreaterThan(0);
    expect(hasil.daftar[0]?.lulus).toEqual({ penyedia: false, nama: false, nilai: true });
  });

  it("tidak_ditemukan ketika tidak ada kandidat yang lolos skor minimum", () => {
    const hasil = match(papanDasar, []);
    expect(hasil.status).toBe("tidak_ditemukan");
    expect(hasil.terbaik).toBeNull();
    expect(hasil.skor).toBe(0);
    expect(hasil.daftar).toEqual([]);
    expect(hasil.perluPilih).toBe(false);
  });

  it("melempar FieldKunciKurang bila field kunci terisi kurang dari 2", () => {
    const satuTerisi: Papan = { ...papanDasar, penyedia: null, nilai_kontrak: null };
    expect(() => match(satuTerisi, [recordDasar])).toThrow(FieldKunciKurang);

    const kosong: Papan = {
      ...papanDasar,
      penyedia: null,
      nama_paket: null,
      nilai_kontrak: null,
    };
    expect(() => match(kosong, [recordDasar])).toThrow(FieldKunciKurang);
  });

  it("perluPilih bernilai true ketika dua kandidat teratas hampir seri dan sama-sama layak", () => {
    const kandidatA: RecordResmi = { ...recordDasar, id: "a" };
    const kandidatB: RecordResmi = {
      ...recordDasar,
      id: "b",
      nama_paket: "Rehabilitasi Jalan Desa Sukamaju Baru", // masih lulus nama, skor sedikit lebih rendah
    };
    const hasil = match(papanDasar, [kandidatA, kandidatB]);
    expect(hasil.perluPilih).toBe(true);
    expect(hasil.daftar.length).toBe(2);
    expect(hasil.terbaik?.id).toBe("a");
  });
});
