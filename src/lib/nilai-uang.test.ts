import { describe, expect, it } from "vitest";
import { parseNilaiUang } from "./nilai-uang";

describe("parseNilaiUang", () => {
  it("menerima format dengan Rp dan titik ribuan", () => {
    expect(parseNilaiUang("Rp 1.234.567")).toBe(1_234_567);
    expect(parseNilaiUang("Rp1.234.567")).toBe(1_234_567);
  });

  it("menerima angka polos", () => {
    expect(parseNilaiUang("1234567")).toBe(1_234_567);
    expect(parseNilaiUang("150000000")).toBe(150_000_000);
  });

  it("menerima desimal dengan koma dan membuang pecahan", () => {
    expect(parseNilaiUang("1234567,00")).toBe(1_234_567);
    expect(parseNilaiUang("Rp 1.234.567,50")).toBe(1_234_567);
  });

  it("kosong dan tidak valid menjadi null", () => {
    expect(parseNilaiUang("")).toBeNull();
    expect(parseNilaiUang("   ")).toBeNull();
    expect(parseNilaiUang("Rp")).toBeNull();
    expect(parseNilaiUang("abc")).toBeNull();
  });

  // Sepuluh vektor D.2 PRD v1.1.
  describe("vektor D.2", () => {
    const vektor: Array<[string, number | null]> = [
      ["Rp 1.250.000.000", 1_250_000_000],
      ["1250000000", 1_250_000_000],
      ["1.250.000.000,00", 1_250_000_000],
      ["Rp. 875.000.000", 875_000_000],
      ["12.50", null],
      ["1,5 miliar", null],
      ["0", null],
      ["-5", null],
      ["abc", null],
      ["", null],
    ];
    for (const [masukan, diharapkan] of vektor) {
      it(`"${masukan}" → ${diharapkan === null ? "null" : diharapkan}`, () => {
        expect(parseNilaiUang(masukan)).toBe(diharapkan);
      });
    }
  });
});
