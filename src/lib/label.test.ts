import { describe, expect, it } from "vitest";
import { labelUntuk } from "./label";

describe("labelUntuk", () => {
  it("persen_progres SELALU belum_diketahui", () => {
    expect(labelUntuk("persen_progres")).toBe("belum_diketahui");
  });

  it("sumber resmi dan papan terkonfirmasi -> tercatat", () => {
    expect(labelUntuk("catatan_resmi")).toBe("tercatat");
    expect(labelUntuk("papan_terkonfirmasi")).toBe("tercatat");
  });

  it("data hitungan -> hitungan", () => {
    expect(labelUntuk("hari_berjalan")).toBe("hitungan");
    expect(labelUntuk("selisih_nilai")).toBe("hitungan");
  });

  it("jenis tak dikenal -> belum_diketahui", () => {
    expect(labelUntuk("jenis_baru")).toBe("belum_diketahui");
  });
});
