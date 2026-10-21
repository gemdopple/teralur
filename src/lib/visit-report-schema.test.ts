import { describe, expect, it } from "vitest";
import { visitReportRequestSchema } from "./api-contract";

// Kunci skema F-14 (T-21): catatan opsional, maks. 200 karakter; nilai keadaan
// memakai enum mesin bahasa Inggris sesuai katalog rute §7.5.
describe("visitReportRequestSchema", () => {
  it("menerima laporan tanpa catatan (note opsional)", () => {
    expect(
      visitReportRequestSchema.parse({
        dossierSlug: "abcDEF123-_x",
        activityStatus: "active",
      }),
    ).toEqual({ dossierSlug: "abcDEF123-_x", activityStatus: "active" });
  });

  it("menerima catatan sampai 200 karakter dan menolak lebih", () => {
    const base = { dossierSlug: "abcDEF123-_x", activityStatus: "no_activity_seen" as const };
    expect(visitReportRequestSchema.safeParse({ ...base, note: "a".repeat(200) }).success).toBe(true);
    expect(visitReportRequestSchema.safeParse({ ...base, note: "a".repeat(201) }).success).toBe(false);
  });

  it("menolak activityStatus di luar enum dan slug yang tidak sesuai bentuk", () => {
    const base = { dossierSlug: "abcDEF123-_x", activityStatus: "selesai" };
    expect(visitReportRequestSchema.safeParse(base).success).toBe(false);
    expect(
      visitReportRequestSchema.safeParse({
        dossierSlug: "terlalu pendek",
        activityStatus: "active",
      }).success,
    ).toBe(false);
  });

  it("enum hanya memuat tiga nilai mesin §7.5", () => {
    for (const activityStatus of ["active", "no_activity_seen", "appears_complete"]) {
      expect(
        visitReportRequestSchema.safeParse({ dossierSlug: "abcDEF123-_x", activityStatus }).success,
      ).toBe(true);
    }
  });
});
