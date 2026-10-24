import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatTanggal, jakartaToday } from "./dates";

describe("jakartaToday (WIB, C-09)", () => {
  it("mengembalikan tanggal kalender WIB untuk instan UTC", () => {
    // 2026-10-24T02:00:00Z = 09:00 WIB → masih 24 Oktober.
    expect(jakartaToday(new Date("2026-10-24T02:00:00Z"))).toBe("2026-10-24");
  });

  it("batas WIB: instan UTC yang sudah menjadi hari berikutnya di Jakarta", () => {
    // 2026-10-24T18:00:00Z = 2026-10-25 01:00 WIB → 25 Oktober.
    expect(jakartaToday(new Date("2026-10-24T18:00:00Z"))).toBe("2026-10-25");
    // 2026-10-24T16:59:00Z = 2026-10-24 23:59 WIB → masih 24 Oktober.
    expect(jakartaToday(new Date("2026-10-24T16:59:00Z"))).toBe("2026-10-24");
    // 2026-10-24T17:00:00Z = tepat 00:00 WIB → 25 Oktober.
    expect(jakartaToday(new Date("2026-10-24T17:00:00Z"))).toBe("2026-10-25");
  });

  it("awal tahun: 2025-12-31T18:00:00Z = 2026-01-01 WIB", () => {
    expect(jakartaToday(new Date("2025-12-31T18:00:00Z"))).toBe("2026-01-01");
  });

  it("format selalu TTTT-BB-HH", () => {
    expect(jakartaToday(new Date("2026-03-05T10:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("daysBetween", () => {
  it("menghitung selisih hari kalender", () => {
    expect(daysBetween("2026-08-11", "2026-10-24")).toBe(74);
    expect(daysBetween("2026-05-27", "2026-10-24")).toBe(150);
    expect(daysBetween("2026-10-24", "2026-10-24")).toBe(0);
  });

  it("negatif bila to sebelum from, dan stabil melewati batas bulan/tahun", () => {
    expect(daysBetween("2026-10-24", "2026-10-23")).toBe(-1);
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2); // 2028 kabisat: 29 Feb dihitung
  });
});

describe("addDays", () => {
  it("menambah hari dan melewati batas bulan", () => {
    expect(addDays("2026-10-24", 0)).toBe("2026-10-24");
    expect(addDays("2026-10-24", 7)).toBe("2026-10-31");
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("menerima bilangan negatif", () => {
    expect(addDays("2026-10-24", -90)).toBe("2026-07-26");
  });
});

describe("formatTanggal (id-ID, bulan panjang, UTC)", () => {
  it("memformat tanpa bergeser sehari", () => {
    expect(formatTanggal("2026-08-11")).toBe("11 Agustus 2026");
    expect(formatTanggal("2026-10-24")).toBe("24 Oktober 2026");
    expect(formatTanggal("2026-01-01")).toBe("1 Januari 2026");
  });
});
