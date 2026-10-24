import { describe, expect, it } from "vitest";
import {
  AdminBoardSchema,
  AdminProjectPatchSchema,
  AdminProjectCreateSchema,
  AdminRecordSchema,
  mergePatch,
} from "./schemas";

const PAPAN_COCOK = {
  packageName: "Rehabilitasi Jalan Lingkungan Melati Raya Kecamatan Sukamaju",
  supplier: "PT Karya Bangun Nusantara Jaya",
  contractValue: 1_485_000_000,
  durationDays: 90,
  fiscalYear: 2026,
  fundingSource: "APBD 2026",
  agencyUnit: "Dinas Pekerjaan Umum Kota Tirtamulya",
  contractNumber: "SIM/001/2026",
  contractDate: "2026-08-11",
  locationText: "Kecamatan Sukamaju",
};

const RESMI_COCOK = {
  ...PAPAN_COCOK,
  supplier: "PT KARYA BANGUN NUSANTARA JAYA",
};

describe("AdminProjectCreateSchema", () => {
  it("menolak create tanpa officialRecord.supplier", () => {
    const tanpaSupplier: Record<string, unknown> = { ...RESMI_COCOK };
    delete tanpaSupplier.supplier;
    const hasil = AdminProjectCreateSchema.safeParse({
      board: PAPAN_COCOK,
      officialRecord: tanpaSupplier,
    });
    expect(hasil.success).toBe(false);
    if (!hasil.success) {
      const jalur = hasil.error.issues.map((i) => i.path.join("."));
      expect(jalur).toContain("officialRecord.supplier");
    }
  });

  it("menolak contractDate 2026-02-30 (tanggal tidak ada di kalender)", () => {
    const hasil = AdminProjectCreateSchema.safeParse({
      board: { ...PAPAN_COCOK, contractDate: "2026-02-30" },
      officialRecord: { ...RESMI_COCOK, contractDate: "2026-02-30" },
    });
    expect(hasil.success).toBe(false);
    if (!hasil.success) {
      const jalur = hasil.error.issues.map((i) => i.path.join("."));
      expect(jalur).toContain("board.contractDate");
      expect(jalur).toContain("officialRecord.contractDate");
    }
  });

  it("field opsional yang tidak dikirim menjadi null setelah parse", () => {
    const hasil = AdminProjectCreateSchema.parse({
      board: { packageName: "Pembangunan Drainase Desa" },
      officialRecord: {
        packageName: "Pembangunan Drainase Desa",
        supplier: "CV Sinar Tirta Konstruksi",
        contractValue: 875_000_000,
      },
    });
    expect(hasil.featured).toBe(false);
    for (const kunci of [
      "durationDays",
      "fiscalYear",
      "fundingSource",
      "agencyUnit",
      "contractNumber",
      "contractDate",
      "locationText",
    ]) {
      expect(hasil.board[kunci as keyof typeof hasil.board]).toBeNull();
      expect(hasil.officialRecord[kunci as keyof typeof hasil.officialRecord]).toBeNull();
    }
  });

  it("menolak nilai kontrak nol atau negatif di sisi resmi", () => {
    const hasil = AdminRecordSchema.safeParse({
      ...RESMI_COCOK,
      contractValue: 0,
    });
    expect(hasil.success).toBe(false);
  });
});

describe("AdminBoardSchema", () => {
  it("mewajibkan packageName dan memotong spasi", () => {
    expect(AdminBoardSchema.safeParse({ ...PAPAN_COCOK, packageName: "   " }).success).toBe(false);
    expect(AdminBoardSchema.parse({ ...PAPAN_COCOK, packageName: "  Rehabilitasi Jalan  " }).packageName).toBe(
      "Rehabilitasi Jalan",
    );
  });
});

describe("AdminProjectPatchSchema", () => {
  it("menolak body kosong", () => {
    expect(AdminProjectPatchSchema.safeParse({}).success).toBe(false);
  });

  it("menerima patch sebagian", () => {
    const hasil = AdminProjectPatchSchema.parse({ board: { contractValue: 875_000_000 } });
    expect(hasil.board?.contractValue).toBe(875_000_000);
    expect(hasil.board?.supplier).toBeUndefined();
  });
});

describe("mergePatch (aturan PATCH D.1)", () => {
  it("tidak menimpa kunci yang tidak dikirim", () => {
    const tersimpan = { ...PAPAN_COCOK };
    const raw = { contractValue: 875_000_000 };
    const parsed = { contractValue: 875_000_000 };
    const hasil = mergePatch(tersimpan, raw, parsed);
    expect(hasil.contractValue).toBe(875_000_000);
    expect(hasil.supplier).toBe(PAPAN_COCOK.supplier);
    expect(hasil.durationDays).toBe(PAPAN_COCOK.durationDays);
    expect(hasil.contractDate).toBe(PAPAN_COCOK.contractDate);
  });

  it("kunci yang dikirim null mengosongkan nilai", () => {
    const hasil = mergePatch(PAPAN_COCOK, { fundingSource: null }, { fundingSource: null });
    expect(hasil.fundingSource).toBeNull();
    expect(hasil.supplier).toBe(PAPAN_COCOK.supplier);
  });

  it("kunci asing di body mentah tidak ikut (tidak ada di hasil parse zod)", () => {
    const hasil = mergePatch(PAPAN_COCOK, { slug: "hack" }, {});
    expect(hasil).toEqual(PAPAN_COCOK);
    expect((hasil as unknown as { slug?: string }).slug).toBeUndefined();
  });

  it("murni: tidak mengubah current maupun parsedPatch", () => {
    const tersimpan = { ...PAPAN_COCOK };
    const parsed = { contractValue: 1 };
    const salinanParsed = { ...parsed };
    mergePatch(tersimpan, { contractValue: 1 }, parsed);
    expect(tersimpan.contractValue).toBe(PAPAN_COCOK.contractValue);
    expect(parsed).toEqual(salinanParsed);
  });
});
