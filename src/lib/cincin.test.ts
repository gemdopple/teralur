import { describe, expect, it } from "vitest";
import { hitungCincin } from "./cincin";

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
});
