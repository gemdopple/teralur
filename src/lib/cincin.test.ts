import { describe, expect, it } from "vitest";
import { hitungCincin, inputCincin } from "./cincin";

const HARI_INI = "2026-10-19";
const MULAI = "2026-07-11"; // tepat 100 hari kalender sebelum HARI_INI

describe("hitungCincin", () => {
  it("berjalan: progres belum penuh", () => {
    const cincin = hitungCincin({ masaHari: 200, tanggalMulai: MULAI, hariIni: HARI_INI });
    expect(cincin.keadaan).toBe("berjalan");
    expect(cincin.berjalan).toBe(100);
    expect(cincin.total).toBe(200);
    expect(cincin.isian).toBe(0.5);
  });

  it("berjalan: tepat penuh tanpa melewati", () => {
    const cincin = hitungCincin({ masaHari: 100, tanggalMulai: MULAI, hariIni: HARI_INI });
    expect(cincin.keadaan).toBe("berjalan");
    expect(cincin.isian).toBe(1);
  });

  it("melewati: hari berjalan melebihi masa", () => {
    const cincin = hitungCincin({ masaHari: 99, tanggalMulai: MULAI, hariIni: HARI_INI });
    expect(cincin.keadaan).toBe("melewati");
    expect(cincin.isian).toBe(1);
  });

  it("tak_terhitung: masaHari atau tanggalMulai tidak ada", () => {
    expect(hitungCincin({ masaHari: null, tanggalMulai: MULAI, hariIni: HARI_INI })).toEqual({
      keadaan: "tak_terhitung",
      berjalan: null,
      total: null,
      isian: 0,
    });
    expect(hitungCincin({ masaHari: 120, tanggalMulai: null, hariIni: HARI_INI }).keadaan).toBe(
      "tak_terhitung",
    );
  });

  it("tak_terhitung: masaHari tidak positif (tanpa pembagian nol, tanpa cincin terisi)", () => {
    for (const masaHari of [0, -30]) {
      const cincin = hitungCincin({ masaHari, tanggalMulai: MULAI, hariIni: HARI_INI });
      expect(cincin).toEqual({ keadaan: "tak_terhitung", berjalan: null, total: null, isian: 0 });
      expect(Number.isFinite(cincin.isian)).toBe(true);
    }
  });

  it("berjalan: tanggal mulai di masa depan dijepit ke 0", () => {
    const cincin = hitungCincin({ masaHari: 90, tanggalMulai: "2026-12-01", hariIni: HARI_INI });
    expect(cincin.keadaan).toBe("berjalan");
    expect(cincin.berjalan).toBe(0);
    expect(cincin.isian).toBe(0);
  });
});

describe("inputCincin (presedensi fallback §6.5)", () => {
  const PAPAN = { durationDays: 120, contractDate: "2026-01-01" };
  const CATATAN = { masa_hari: 200, tanggal_kontrak: "2026-02-01" };

  it("kedua sumber ada: total dari papan, mulai dari catatan", () => {
    expect(inputCincin(PAPAN, CATATAN)).toEqual({ masaHari: 120, tanggalMulai: "2026-02-01" });
  });

  it("hanya papan: total dan mulai dari papan", () => {
    expect(inputCincin(PAPAN, null)).toEqual({ masaHari: 120, tanggalMulai: "2026-01-01" });
    expect(inputCincin(PAPAN, {})).toEqual({ masaHari: 120, tanggalMulai: "2026-01-01" });
  });

  it("hanya catatan: total dan mulai dari catatan", () => {
    expect(inputCincin(null, CATATAN)).toEqual({ masaHari: 200, tanggalMulai: "2026-02-01" });
    expect(inputCincin({}, CATATAN)).toEqual({ masaHari: 200, tanggalMulai: "2026-02-01" });
  });

  it("field satu-satu null dipakai sebagai kosong, bukan 0/undefined", () => {
    expect(inputCincin({ durationDays: null }, CATATAN)).toEqual({
      masaHari: 200,
      tanggalMulai: "2026-02-01",
    });
    expect(inputCincin(PAPAN, { tanggal_kontrak: null })).toEqual({
      masaHari: 120,
      tanggalMulai: "2026-01-01",
    });
  });

  it("tidak ada sumber: keduanya null", () => {
    expect(inputCincin(null, null)).toEqual({ masaHari: null, tanggalMulai: null });
    expect(inputCincin({}, {})).toEqual({ masaHari: null, tanggalMulai: null });
  });
});
