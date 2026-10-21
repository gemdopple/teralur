import { afterEach, describe, expect, it, vi } from "vitest";
import { extractPapan, ModelTimeoutError } from "./vision";

const VALID_JSON = {
  nama_paket: "Rehabilitasi Jalan Desa Sukamaju",
  penyedia: "PT Bangun Jaya",
  nilai_kontrak: 150_000_000,
  masa_hari: 120,
  tahun_anggaran: 2026,
  sumber_dana: "DAK",
  satuan_kerja: "DPUPR",
  nomor_kontrak: "123/DPUPR/2026",
  tanggal_kontrak: "2026-07-11",
  lokasi_teks: "Desa Sukamaju",
  unreadFields: ["lokasi_teks"],
};

function fakeFetchRespon(content: unknown, dipanggil: { n: number }): typeof fetch {
  return (async () => {
    dipanggil.n++;
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) } }],
      }),
      { status: 200 },
    );
  }) as typeof fetch;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("extractPapan", () => {
  it("memetakan keluaran model ke field internal dan unreadFields", async () => {
    vi.stubEnv("MODEL_API_KEY", "kunci-uji");
    const dipanggil = { n: 0 };
    const hasil = await extractPapan(Buffer.from("foto"), {
      fetchImpl: fakeFetchRespon(VALID_JSON, dipanggil),
    });
    expect(dipanggil.n).toBe(1);
    expect(hasil.nama_paket).toBe("Rehabilitasi Jalan Desa Sukamaju");
    expect(hasil.nilai_kontrak).toBe(150_000_000);
    expect(hasil.tanggal_kontrak).toBe("2026-07-11");
    expect(hasil.unreadFields).toEqual(["lokasi_teks"]);
  });

  it("mengisi unreadFields kosong bila model tidak mengirimkannya", async () => {
    vi.stubEnv("MODEL_API_KEY", "kunci-uji");
    const { unreadFields: _unreadFields, ...tanpaUnread } = VALID_JSON;
    const hasil = await extractPapan(Buffer.from("foto"), {
      fetchImpl: fakeFetchRespon(tanpaUnread, { n: 0 }),
    });
    expect(hasil.unreadFields).toEqual([]);
  });

  it("melempar ModelTimeoutError bila panggilan model melewati batas waktu", async () => {
    vi.stubEnv("MODEL_API_KEY", "kunci-uji");
    const lambat: typeof fetch = ((_url: string | URL, init?: RequestInit) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "TimeoutError")),
        );
      })) as typeof fetch;
    await expect(
      extractPapan(Buffer.from("foto"), { fetchImpl: lambat, timeoutMs: 10 }),
    ).rejects.toBeInstanceOf(ModelTimeoutError);
  }, 5_000);

  it("mengulang satu kali bila JSON tidak valid, lalu gagal", async () => {
    vi.stubEnv("MODEL_API_KEY", "kunci-uji");
    const dipanggil = { n: 0 };
    await expect(
      extractPapan(Buffer.from("foto"), {
        fetchImpl: fakeFetchRespon("bukan json sama sekali", dipanggil),
      }),
    ).rejects.toThrow("tidak memuat JSON");
    expect(dipanggil.n).toBe(2);
  });
});
