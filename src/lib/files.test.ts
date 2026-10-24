import { describe, expect, it } from "vitest";
import { detectFile } from "./files";

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const webp = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50,
]);
const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

describe("detectFile (Lampiran J.1)", () => {
  it("mengenali empat tanda tangan yang benar", () => {
    expect(detectFile(jpeg)).toEqual({ mime: "image/jpeg", ext: "jpg", kind: "photo" });
    expect(detectFile(png)).toEqual({ mime: "image/png", ext: "png", kind: "photo" });
    expect(detectFile(webp)).toEqual({ mime: "image/webp", ext: "webp", kind: "photo" });
    expect(detectFile(pdf)).toEqual({ mime: "application/pdf", ext: "pdf", kind: "document" });
  });

  it("berkas teks yang diberi ekstensi gambar tetap null (isi yang menentukan)", () => {
    const teks = new TextEncoder().encode("ini bukan gambar, hanya teks biasa");
    expect(detectFile(teks)).toBeNull();
  });

  it("berkas kosong mengembalikan null", () => {
    expect(detectFile(new Uint8Array(0))).toBeNull();
  });

  it("berkas lebih pendek dari tanda tangan mengembalikan null", () => {
    expect(detectFile(jpeg.slice(0, 2))).toBeNull(); // JPEG butuh ≥3 byte
    expect(detectFile(png.slice(0, 7))).toBeNull(); // PNG butuh ≥8 byte
    expect(detectFile(webp.slice(0, 11))).toBeNull(); // WebP butuh ≥12 byte
    expect(detectFile(pdf.slice(0, 4))).toBeNull(); // PDF butuh ≥5 byte
  });

  it("tanda tangan yang salah di satu byte mengembalikan null", () => {
    const pngRusak = Uint8Array.from(png);
    pngRusak[0] = 0x88;
    expect(detectFile(pngRusak)).toBeNull();
    const webpTanpaRiff = Uint8Array.from(webp);
    webpTanpaRiff[8] = 0x00; // byte pertama "WEBP" pada offset 8 dinolkan
    expect(detectFile(webpTanpaRiff)).toBeNull();
  });
});
