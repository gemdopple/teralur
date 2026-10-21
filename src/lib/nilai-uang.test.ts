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
});
