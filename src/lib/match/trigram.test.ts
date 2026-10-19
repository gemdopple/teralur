import { describe, expect, it } from "vitest";
import { trigramSimilarity } from "./trigram";

describe("trigramSimilarity", () => {
  it("mengembalikan 1 untuk teks identik", () => {
    expect(trigramSimilarity("jalan desa sukamaju", "jalan desa sukamaju")).toBe(1);
  });

  it("mengembalikan nilai mendekati 0 untuk teks tak berhubungan", () => {
    expect(trigramSimilarity("abcdefgh", "xyzwvu")).toBeLessThanOrEqual(0.1);
    expect(trigramSimilarity("sekolah", "jembatan")).toBeLessThanOrEqual(0.2);
  });

  it("memberikan nilai di antara 0 dan 1 untuk kemiripan sebagian", () => {
    const sim = trigramSimilarity("bangun jaya", "bangun jaya perkasa");
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  it("mengembalikan 0 bila salah satu teks tidak punya trigram", () => {
    expect(trigramSimilarity("", "jalan")).toBe(0);
  });
});
