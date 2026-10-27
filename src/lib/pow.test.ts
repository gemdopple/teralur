import { createHash, createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { KESULITAN_POW, bitNolHex } from "./pow";
import { tantanganPoW, verifikasiPoW } from "./pow-server";

// Kunci uji: IP_HASH_SALT wajib ada agar verifikasi tidak fail-closed kosong.
beforeAll(() => {
  process.env.IP_HASH_SALT = "garam-uji-pow";
});

function pecahkan(tantangan: string, kesulitan: number): string {
  for (let nonce = 0; nonce < 5_000_000; nonce++) {
    const n = nonce.toString(16);
    const hex = createHash("sha256").update(`${tantangan}:${n}`).digest("hex");
    if (bitNolHex(hex) >= kesulitan) return n;
  }
  throw new Error("tidak terpecahkan");
}

describe("bitNolHex", () => {
  it("menghitung bit nol di depan, termasuk sebagian per digit hex", () => {
    expect(bitNolHex("00000000")).toBe(32);
    expect(bitNolHex("0fffffff")).toBe(4);
    expect(bitNolHex("7fffffff")).toBe(1);
    expect(bitNolHex("8fffffff")).toBe(0);
    expect(bitNolHex("ffffffff")).toBe(0);
    expect(bitNolHex("")).toBe(0);
  });
});

describe("verifikasiPoW", () => {
  it("menerima bukti valid yang benar-benar dipecahkan", () => {
    const { tantangan } = tantanganPoW();
    const nonce = pecahkan(tantangan, KESULITAN_POW);
    expect(verifikasiPoW(tantangan, nonce)).toBe(true);
  });

  it("menolak nonce yang tidak menghasilkan bit nol cukup", () => {
    const { tantangan } = tantanganPoW();
    expect(verifikasiPoW(tantangan, "ffffffff", KESULITAN_POW)).toBe(false);
  });

  it("kesulitan bisa diturunkan untuk pengujian", () => {
    const { tantangan } = tantanganPoW();
    const nonce = pecahkan(tantangan, 4);
    expect(verifikasiPoW(tantangan, nonce, 4)).toBe(true);
    // bukti kesulitan-4 tidak lulus kesulitan penuh
    if (bitNolHex(createHash("sha256").update(`${tantangan}:${nonce}`).digest("hex")) < KESULITAN_POW) {
      expect(verifikasiPoW(tantangan, nonce)).toBe(false);
    }
  });

  it("menolak tantangan dengan tanda HMAC dipalsukan", () => {
    const { tantangan } = tantanganPoW();
    const [ts] = tantangan.split(".");
    const palsu = `${ts}.${"0".repeat(64)}`;
    const nonce = pecahkan(palsu, 4);
    expect(verifikasiPoW(palsu, nonce, 4)).toBe(false);
  });

  it("menolak tantangan kedaluwarsa", () => {
    const tua = Date.now() - 11 * 60 * 1000;
    const { tantangan } = tantanganPoW(tua);
    const nonce = pecahkan(tantangan, 4);
    expect(verifikasiPoW(tantangan, nonce, 4)).toBe(false);
  });

  it("menolak bentuk yang salah: nonce non-hex, tantangan bukan format", () => {
    const { tantangan } = tantanganPoW();
    expect(verifikasiPoW("bukan-tantangan", "ab")).toBe(false);
    expect(verifikasiPoW(tantangan, "ZZZZ")).toBe(false);
    expect(verifikasiPoW(tantangan, "")).toBe(false);
  });

  it("HMAC memakai IP_HASH_SALT — kunci lain menghasilkan tanda berbeda", () => {
    const { tantangan } = tantanganPoW();
    const [ts] = tantangan.split(".");
    const kunciLain = createHmac("sha256", "bukan-garam").update(`pow:${ts}`).digest("hex");
    expect(kunciLain).not.toBe(tantangan.split(".")[1]);
  });
});
