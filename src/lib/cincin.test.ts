import { describe, expect, it } from "vitest";
import { computeTimeRing, hitungCincin, inputCincin, RING_NOTE, ringkasanWarga } from "./cincin";
import type { RingInput } from "./cincin";

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

  it("mengutamakan tanggal mulai pelaksanaan papan dari tanggal kontrak papan", () => {
    expect(
      inputCincin({ ...PAPAN, executionStartDate: "2026-03-01" }, { tanggal_kontrak: null }),
    ).toEqual({ masaHari: 120, tanggalMulai: "2026-03-01" });
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

// ---------------------------------------------------------------------------
// Cincin lengkap Lampiran G.1 — sepuluh vektor G.2 (hari ini = 2026-10-24).

const HARI_INI_G2 = "2026-10-24";

function masuk(overrides: Partial<RingInput>): RingInput {
  return {
    boardDurationDays: null,
    recordDurationDays: null,
    boardContractDate: null,
    recordContractDate: null,
    today: HARI_INI_G2,
    ...overrides,
  };
}

describe("computeTimeRing (vektor G.2, hari ini = 2026-10-24)", () => {
  it("1. masa 90 dari papan, mulai 2026-08-11 dari catatan: running 74/90", () => {
    const ring = computeTimeRing(
      masuk({ boardDurationDays: 90, recordContractDate: "2026-08-11" }),
    );
    expect(ring.state).toBe("running");
    expect(ring.elapsedDays).toBe(74);
    expect(ring.totalDays).toBe(90);
    expect(ring.centerText).toBe("74/90");
    expect(ring.caption).toBe("Hari ke-74 dari 90");
    expect(ring.totalSource).toBe("board");
    expect(ring.startSource).toBe("record");
    expect(ring.fillRatio).toBeCloseTo(74 / 90, 10);
    expect(ring.overDays).toBeNull();
  });

  it("2. masa 90 hanya dari catatan resmi: running 74/90 (total dari catatan)", () => {
    const ring = computeTimeRing(
      masuk({ recordDurationDays: 90, recordContractDate: "2026-08-11" }),
    );
    expect(ring.state).toBe("running");
    expect(ring.centerText).toBe("74/90");
    expect(ring.caption).toBe("Hari ke-74 dari 90");
    expect(ring.totalSource).toBe("record");
    expect(ring.startSource).toBe("record");
  });

  it("3. melewati 60 hari: over dengan caption persis", () => {
    const ring = computeTimeRing(
      masuk({ boardDurationDays: 90, recordContractDate: "2026-05-27" }),
    );
    expect(ring.state).toBe("over");
    expect(ring.overDays).toBe(60);
    expect(ring.centerText).toBe("90/90");
    expect(ring.fillRatio).toBe(1);
    expect(ring.caption).toBe(
      "Melewati masa kontrak tercatat 60 hari. Addendum atau perpanjangan mungkin ada.",
    );
  });

  it("4. tanpa tanggal mulai: unknown 'Tanggal mulai tidak tersedia'", () => {
    const ring = computeTimeRing(masuk({ boardDurationDays: 90 }));
    expect(ring.state).toBe("unknown");
    expect(ring.caption).toBe("Tanggal mulai tidak tersedia");
    expect(ring.centerText).toBe("–");
    expect(ring.fillRatio).toBe(0);
    expect(ring.startDate).toBeNull();
    expect(ring.startSource).toBeNull();
  });

  it("5. tanpa masa pelaksanaan: unknown 'Masa pelaksanaan tidak tersedia' (C-02)", () => {
    const ring = computeTimeRing(masuk({ recordContractDate: "2026-10-14" }));
    expect(ring.state).toBe("unknown");
    expect(ring.caption).toBe("Masa pelaksanaan tidak tersedia");
    expect(ring.centerText).toBe("–");
    expect(ring.fillRatio).toBe(0);
    expect(ring.totalDays).toBeNull();
    expect(ring.totalSource).toBeNull();
  });

  it("6. mulai dari papan 2026-10-19: running 5/90", () => {
    const ring = computeTimeRing(masuk({ boardDurationDays: 90, boardContractDate: "2026-10-19" }));
    expect(ring.state).toBe("running");
    expect(ring.centerText).toBe("5/90");
    expect(ring.startSource).toBe("board");
    expect(ring.totalSource).toBe("board");
  });

  it("7. mulai hari ini: running 0/90", () => {
    const ring = computeTimeRing(
      masuk({ boardDurationDays: 90, recordContractDate: "2026-10-24" }),
    );
    expect(ring.state).toBe("running");
    expect(ring.elapsedDays).toBe(0);
    expect(ring.centerText).toBe("0/90");
    expect(ring.caption).toBe("Hari ke-0 dari 90");
    expect(ring.fillRatio).toBe(0);
  });

  it("8. tepat di batas (90 hari): running 90/90, bukan over", () => {
    const ring = computeTimeRing(
      masuk({ boardDurationDays: 90, recordContractDate: "2026-07-26" }),
    );
    expect(ring.state).toBe("running");
    expect(ring.centerText).toBe("90/90");
    expect(ring.fillRatio).toBe(1);
    expect(ring.overDays).toBeNull();
    expect(ring.caption).toBe("Hari ke-90 dari 90");
  });

  it("9. satu hari setelah batas: over 1 hari", () => {
    const ring = computeTimeRing(
      masuk({ boardDurationDays: 90, recordContractDate: "2026-07-25" }),
    );
    expect(ring.state).toBe("over");
    expect(ring.overDays).toBe(1);
    expect(ring.caption).toBe(
      "Melewati masa kontrak tercatat 1 hari. Addendum atau perpanjangan mungkin ada.",
    );
  });

  it("10. tanggal mulai di masa depan: not_started 0/90 (C-01)", () => {
    const ring = computeTimeRing(
      masuk({ boardDurationDays: 90, recordContractDate: "2026-10-29" }),
    );
    expect(ring.state).toBe("not_started");
    expect(ring.centerText).toBe("0/90");
    expect(ring.fillRatio).toBe(0);
    expect(ring.caption).toBe("Belum dimulai. Tanggal mulai tercatat 29 Oktober 2026.");
  });

  it("RING_NOTE konstan", () => {
    expect(RING_NOTE).toBe("Ini waktu yang telah berjalan, bukan kemajuan fisik.");
  });

  it("tidak mengubah masukan", () => {
    const input = masuk({ boardDurationDays: 90, recordContractDate: "2026-08-11" });
    const salinan = structuredClone(input);
    computeTimeRing(input);
    expect(input).toEqual(salinan);
  });
});

describe("ringkasanWarga", () => {
  const dasar = {
    boardDurationDays: 100,
    recordDurationDays: null,
    boardContractDate: "2026-01-01",
    recordContractDate: null,
  };

  it("menghitung persen, perkiraan selesai, dan hari tersisa", () => {
    const ring = computeTimeRing({ ...dasar, today: "2026-01-31" }); // hari ke-30
    const ringkasan = ringkasanWarga(ring);
    expect(ringkasan.tersedia).toBe(true);
    expect(ringkasan.persen).toBe(30);
    expect(ringkasan.perkiraanSelesai).toBe("2026-04-11"); // 1 Jan + 100 hari
    expect(ringkasan.sisaHari).toBe(70);
  });

  it("memuaatkan 100 dan menandai terlewat setelah lewat perkiraan", () => {
    const ring = computeTimeRing({ ...dasar, today: "2026-05-01" }); // hari ke-120
    const ringkasan = ringkasanWarga(ring);
    expect(ringkasan.persen).toBe(100);
    expect(ringkasan.lewat).toBe(true);
    expect(ringkasan.sisaHari).toBe(-20);
  });

  it("belum dimulai: persen 0 tanpa hari tersisa negatif", () => {
    const ring = computeTimeRing({
      ...dasar,
      boardContractDate: "2030-01-01",
      today: "2026-01-01",
    });
    const ringkasan = ringkasanWarga(ring);
    expect(ringkasan.tersedia).toBe(false);
    expect(ringkasan.persen).toBeNull();
  });

  it("tanpa tanggal mulai: tidak tersedia", () => {
    const ring = computeTimeRing({
      boardDurationDays: 100,
      recordDurationDays: null,
      boardContractDate: null,
      recordContractDate: null,
      today: "2026-01-01",
    });
    expect(ringkasanWarga(ring).tersedia).toBe(false);
  });
});
