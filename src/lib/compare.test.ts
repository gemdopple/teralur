import { describe, expect, it } from "vitest";
import { compare } from "./compare";
import type { BoardLike } from "./compare";

// Base pair: everything identical and filled (F.4 "Semua sama").
const papanDasar: BoardLike = {
  packageName: "Pembangunan Jalan Melati Desa Sukamaju",
  supplier: "PT Karya Bangun Nusantara Jaya",
  contractValue: 1_485_000_000,
};

function papan(overrides: Partial<BoardLike>): BoardLike {
  return { ...papanDasar, ...overrides };
}

function record(overrides: Partial<BoardLike>): BoardLike {
  return { ...papanDasar, ...overrides };
}

describe("compare (vektor F.4)", () => {
  it("1. semua sama: matched, tiga komponen, skor 1", () => {
    const hasil = compare(papan({}), record({ supplier: "PT KARYA BANGUN NUSANTARA JAYA" }));
    expect(hasil.status).toBe("matched");
    expect(hasil.components).toHaveLength(3);
    expect(hasil.discrepancies).toEqual([]);
    expect(hasil.score).toBe(1);
  });

  it("2. nilai beda 4,11%: discrepancy pada contractValue", () => {
    const hasil = compare(
      papan({ contractValue: 875_000_000 }),
      record({ contractValue: 912_500_000 }),
    );
    expect(hasil.status).toBe("discrepancy");
    expect(hasil.discrepancies.map((c) => c.field)).toEqual(["contractValue"]);
    const nilai = hasil.discrepancies[0];
    expect(nilai?.relativeDifference).not.toBeNull();
    expect(nilai?.relativeDifference ?? 0).toBeGreaterThan(0.01);
    // 37.500.000 / 912.500.000 = 0,04109...
    expect(nilai?.relativeDifference ?? 0).toBeCloseTo(0.041096, 4);
    // 1 − (0,0411 − 0,01)/0,19 ≈ 0,836
    expect(nilai?.unitScore ?? 0).toBeCloseTo(0.8363, 3);
  });

  it("3. nilai beda 0,22%: matched", () => {
    const hasil = compare(
      papan({ contractValue: 2_310_000_000 }),
      record({ contractValue: 2_305_000_000 }),
    );
    expect(hasil.status).toBe("matched");
    expect(hasil.discrepancies).toEqual([]);
  });

  it("4. penyedia beda (0,4194): discrepancy pada supplier", () => {
    const hasil = compare(
      papan({ supplier: "CV Mitra Sarana Konstruksi" }),
      record({ supplier: "CV Mitra Sarana Teknik" }),
    );
    expect(hasil.status).toBe("discrepancy");
    expect(hasil.discrepancies.map((c) => c.field)).toEqual(["supplier"]);
    const penyedia = hasil.discrepancies[0];
    expect(penyedia?.similarity ?? 0).toBeCloseTo(0.4194, 3);
  });

  it("5. nama paket beda (~0,338): discrepancy pada packageName", () => {
    const hasil = compare(
      papan({ packageName: "Pembangunan Jembatan Kali Sengon Desa Tirtamulya" }),
      record({ packageName: "Rehabilitasi Saluran Irigasi Sengon Desa Tirtamulya" }),
    );
    expect(hasil.status).toBe("discrepancy");
    expect(hasil.discrepancies.map((c) => c.field)).toEqual(["packageName"]);
    const nama = hasil.discrepancies[0];
    expect(nama?.similarity ?? 1).toBeLessThan(0.6);
    expect(nama?.similarity ?? 1).toBeCloseTo(0.338, 2);
  });

  it("6. dua gagal: not_found", () => {
    const hasil = compare(
      papan({ supplier: "CV Bumi Asri Perkasa", contractValue: 1_250_000_000 }),
      record({ supplier: "PT Cahaya Utama Teknik", contractValue: 1_730_000_000 }),
    );
    expect(hasil.status).toBe("not_found");
    expect(hasil.discrepancies.map((c) => c.field)).toEqual(["supplier", "contractValue"]);
  });

  it("7. papan hanya nama paket: not_found (hanya 1 komponen terevaluasi)", () => {
    const hasil = compare(
      papan({ supplier: null, contractValue: null }),
      record({ supplier: "PT Rajawali Karya Abadi", contractValue: 780_000_000 }),
    );
    expect(hasil.status).toBe("not_found");
    expect(hasil.components).toHaveLength(1);
    expect(hasil.components[0]?.field).toBe("packageName");
  });

  it("8. dua terevaluasi, keduanya lulus: matched", () => {
    const hasil = compare(papan({ contractValue: null }), record({ contractValue: 450_000_000 }));
    expect(hasil.status).toBe("matched");
    expect(hasil.components).toHaveLength(2);
    expect(hasil.discrepancies).toEqual([]);
  });

  it("9. dua terevaluasi, satu gagal: not_found (lulus kurang dari 2)", () => {
    const hasil = compare(
      papan({ supplier: "PT Cahaya Utama Teknik", contractValue: null }),
      record({ contractValue: 300_000_000 }),
    );
    expect(hasil.status).toBe("not_found");
    expect(hasil.components).toHaveLength(2);
    expect(hasil.discrepancies.map((c) => c.field)).toEqual(["supplier"]);
  });
});

describe("compare (properti umum)", () => {
  it("skor gabungan selalu di antara 0 dan 1", () => {
    const kasus: Array<[BoardLike, BoardLike]> = [
      [papan({}), record({})],
      [papan({}), record({ contractValue: 912_500_000 })],
      [papan({ supplier: "CV Bumi Asri Perkasa", contractValue: 1_250_000_000 }), record({ supplier: "PT Cahaya Utama Teknik", contractValue: 1_730_000_000 })],
      [papan({ supplier: null, packageName: null, contractValue: null }), record({})],
      [papan({}), record({ supplier: "CV Mitra Sarana Teknik", contractValue: 2_305_000_000 })],
    ];
    for (const [board, rec] of kasus) {
      const { score } = compare(board, rec);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it("tidak mengubah masukan (imutabilitas)", () => {
    const board = papan({ supplier: "CV Mitra Sarana Konstruksi", contractValue: 875_000_000 });
    const rec = record({ supplier: "CV Mitra Sarana Teknik", contractValue: 912_500_000 });
    const salinanBoard = structuredClone(board);
    const salinanRecord = structuredClone(rec);
    compare(board, rec);
    expect(board).toEqual(salinanBoard);
    expect(rec).toEqual(salinanRecord);
  });

  it("urutan komponen tetap: supplier, packageName, contractValue", () => {
    const hasil = compare(
      papan({ supplier: "CV Bumi Asri Perkasa", contractValue: 1_250_000_000 }),
      record({ supplier: "PT Cahaya Utama Teknik", contractValue: 1_730_000_000 }),
    );
    expect(hasil.components.map((c) => c.field)).toEqual([
      "supplier",
      "packageName",
      "contractValue",
    ]);
    expect(hasil.discrepancies.map((c) => c.field)).toEqual(["supplier", "contractValue"]);
  });

  it("unitScore nilai turun linear: 1 pada ≤1%, 0 pada ≥20%", () => {
    const penuh = compare(
      papan({ contractValue: 1_010_000_000 }),
      record({ contractValue: 1_000_000_000 }),
    ); // tepat 1,0% → lulus batas
    expect(penuh.components.find((c) => c.field === "contractValue")?.unitScore).toBe(1);

    const nol = compare(papan({}), record({ contractValue: 2_000_000_000 })); // ~25,8% > 20%
    expect(nol.components.find((c) => c.field === "contractValue")?.unitScore).toBe(0);

    // 11% → 1 − (0,11 − 0,01)/0,19 ≈ 0,4737
    const tengah = compare(
      papan({ contractValue: 1_110_000_000 }),
      record({ contractValue: 1_000_000_000 }),
    );
    expect(
      tengah.components.find((c) => c.field === "contractValue")?.unitScore ?? 0,
    ).toBeCloseTo(0.4737, 3);
  });

  it("field kosong di satu sisi tidak dievaluasi (string kosong = tidak terisi)", () => {
    const hasil = compare(papan({ supplier: "   " }), record({}));
    expect(hasil.components.map((c) => c.field)).toEqual(["packageName", "contractValue"]);
  });
});
