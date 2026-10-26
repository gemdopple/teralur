import { describe, expect, it } from "vitest";
import { normalisasiAngka, normalisasiTeks } from "./normalisasi";

describe("normalisasiTeks", () => {
  it("melakukan lowercase dan menghapus tanda baca", () => {
    expect(normalisasiTeks("Jl. Sudirman No. 12!")).toBe("jalan sudirman no 12");
  });

  it("memperluas singkatan", () => {
    expect(normalisasiTeks("Rehab JL DS KEC KAB")).toBe(
      "rehabilitasi jalan desa kecamatan kabupaten",
    );
  });

  it("menghapus kata umum", () => {
    expect(normalisasiTeks("Paket Pengadaan Pekerjaan Tahun 2024 - PT Maju")).toBe("2024 maju");
  });

  it("mengembalikan teks kosong untuk input tanpa isian", () => {
    expect(normalisasiTeks("")).toBe("");
    expect(normalisasiTeks("... !!!")).toBe("");
  });

  // Empat vektor normalisasi F.4 PRD v1.1.
  describe("vektor normalisasi F.4", () => {
    const vektor: Array<[string, string]> = [
      ["PT. Karya Bangun, Nusantara Jaya", "karya bangun nusantara jaya"],
      ["Jl. Melati Raya Kec. Sukamaju", "jalan melati raya kecamatan sukamaju"],
      [
        "Rehab Drainase Ds. Tirtamulya Tahun Anggaran 2026",
        "rehabilitasi drainase desa tirtamulya 2026",
      ],
      ["CV Sinar Tirta Konstruksi", "sinar tirta konstruksi"],
    ];
    for (const [masukan, diharapkan] of vektor) {
      it(`"${masukan}" → "${diharapkan}"`, () => {
        expect(normalisasiTeks(masukan)).toBe(diharapkan);
      });
    }
  });
});

describe("normalisasiAngka", () => {
  it("menghapus Rp, titik, dan koma", () => {
    expect(normalisasiAngka("Rp 1.234.567")).toBe(1234567);
    expect(normalisasiAngka("Rp15.000.000")).toBe(15000000);
    expect(normalisasiAngka("1,234,567")).toBe(1234567);
  });

  it("menerima angka apa adanya dan mengembalikan null untuk input tak valid", () => {
    expect(normalisasiAngka(15000000)).toBe(15000000);
    expect(normalisasiAngka("kosong")).toBeNull();
    expect(normalisasiAngka("")).toBeNull();
  });
});
