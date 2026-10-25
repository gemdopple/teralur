import { describe, expect, it } from "vitest";
import { HERO_SPECS, heroDossier } from "./hero-dossiers";
import { jakartaToday } from "../lib/dates";

// Salinan statis tiga hero (T-28 mode cadangan). Vektor M.2: status dihitung
// compare() produksi dan keadaan cincin stabil di hari mana pun karena tanggal
// kontrak memakai offset relatif (M.3 no. 6) — sama dengan seed daring.

const HARI_SEED = "2026-10-24"; // hari acuan tabel M.2

function spec(id: string) {
  const spec = HERO_SPECS.find((h) => h.exampleId === id);
  if (!spec) throw new Error(`hero ${id} tidak terdaftar`);
  return spec;
}

describe("HERO_SPECS", () => {
  it("tepat tiga hero unggulan M.2 (demo-001, demo-002, demo-004)", () => {
    expect(HERO_SPECS.map((h) => h.exampleId)).toEqual(["demo-001", "demo-002", "demo-004"]);
  });
});

describe("heroDossier", () => {
  it("demo-001: Cocok, cincin berjalan Hari ke-74 dari 90", () => {
    const hero = heroDossier(spec("demo-001"), HARI_SEED);
    expect(hero.status).toBe("cocok");
    expect(hero.discrepancies).toEqual([]);
    expect(hero.timeRing.state).toBe("running");
    expect(hero.timeRing.centerText).toBe("74/90");
    expect(hero.timeRing.caption).toBe("Hari ke-74 dari 90");
    expect(hero.record.snapshotDate).toBe(HARI_SEED);
  });

  it("demo-002: Selisih nilai kontrak 4,11 persen, cincin Hari ke-45 dari 120", () => {
    const hero = heroDossier(spec("demo-002"), HARI_SEED);
    expect(hero.status).toBe("selisih");
    expect(hero.discrepancies).toEqual([
      {
        field: "contractValue",
        fieldLabel: "Nilai kontrak",
        boardValue: "875000000",
        recordValue: "912500000",
      },
    ]);
    expect(hero.timeRing.state).toBe("running");
    expect(hero.timeRing.caption).toBe("Hari ke-45 dari 120");
  });

  it("demo-004: Cocok, melewati masa kontrak tercatat 60 hari", () => {
    const hero = heroDossier(spec("demo-004"), HARI_SEED);
    expect(hero.status).toBe("cocok");
    expect(hero.timeRing.state).toBe("over");
    expect(hero.timeRing.overDays).toBe(60);
    expect(hero.timeRing.caption).toBe(
      "Melewati masa kontrak tercatat 60 hari. Addendum atau perpanjangan mungkin ada.",
    );
  });

  it("keadaan stabil pada hari lain (offset relatif, M.3 no. 6)", () => {
    const lain = "2026-12-24";
    const demo001 = heroDossier(spec("demo-001"), lain);
    const demo004 = heroDossier(spec("demo-004"), lain);
    expect(demo001.timeRing.caption).toBe("Hari ke-74 dari 90");
    expect(demo004.timeRing.overDays).toBe(60);
  });

  it("hari render valid dari jakartaToday tetap menghasilkan status sama", () => {
    const hariIni = jakartaToday();
    for (const s of HERO_SPECS) {
      const hero = heroDossier(s, hariIni);
      expect(["cocok", "selisih"]).toContain(hero.status);
      expect(hero.timeRing.state).not.toBe("unknown");
    }
  });

  it("board sisi papan selalu tanpa tanggal kontrak (M.1)", () => {
    for (const s of HERO_SPECS) {
      expect(heroDossier(s, HARI_SEED).board.contractDate).toBeNull();
    }
  });
});
