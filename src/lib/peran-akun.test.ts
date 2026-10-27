import { describe, expect, it } from "vitest";
import {
  contractorIdEfektif,
  daftarAdminDari,
  peranEfektif,
  type BarisProfil,
} from "./peran-akun";

// Logika peran efektif: sumber kebenaran akses server-side (bukan cookie).

const ADMIN = ["admin@instansi.go.id"];

describe("daftarAdminDari", () => {
  it("memisah koma, merapikan spasi, dan menurunkan huruf", () => {
    expect(daftarAdminDari(" A@X.go.id , ,b@x.go.id ")).toEqual(["a@x.go.id", "b@x.go.id"]);
  });

  it("string kosong/undefined menjadi daftar kosong", () => {
    expect(daftarAdminDari(undefined)).toEqual([]);
    expect(daftarAdminDari("")).toEqual([]);
  });
});

describe("peranEfektif", () => {
  it("memakai peran dari baris profil bila valid", () => {
    const profil: BarisProfil = { role: "kontraktor", contractor_id: "c1" };
    expect(peranEfektif(profil, "siapa@apa.co.id", ADMIN)).toBe("kontraktor");
  });

  it("pemerintah dari profil menang meski email ada di allowlist admin", () => {
    const profil: BarisProfil = { role: "pemerintah", contractor_id: null };
    expect(peranEfektif(profil, "admin@instansi.go.id", ADMIN)).toBe("pemerintah");
  });

  it("tanpa profil: email di allowlist -> admin (akun lama tetap jalan)", () => {
    expect(peranEfektif(null, "admin@instansi.go.id", ADMIN)).toBe("admin");
    expect(peranEfektif(null, "ADMIN@Instansi.Go.Id", ADMIN)).toBe("admin");
  });

  it("tanpa profil dan bukan admin -> pemerintah", () => {
    expect(peranEfektif(null, "orang@luar.co.id", ADMIN)).toBe("pemerintah");
    expect(peranEfektif(null, null, ADMIN)).toBe("pemerintah");
  });

  it("role tak dikenal di baris profil diabaikan (jatuh ke aturan cadangan)", () => {
    const profil = { role: "superuser", contractor_id: null } as unknown as BarisProfil;
    expect(peranEfektif(profil, "admin@instansi.go.id", ADMIN)).toBe("admin");
  });
});

describe("contractorIdEfektif", () => {
  it("mengembalikan id untuk peran kontraktor", () => {
    expect(contractorIdEfektif({ role: "kontraktor", contractor_id: "c1" })).toBe("c1");
  });

  it("null untuk peran non-kontraktor walau contractor_id terisi", () => {
    expect(contractorIdEfektif({ role: "admin", contractor_id: "c1" })).toBeNull();
    expect(contractorIdEfektif({ role: "pemerintah", contractor_id: "c1" })).toBeNull();
  });

  it("null tanpa profil (tidak pernah membocorkan penugasan)", () => {
    expect(contractorIdEfektif(null)).toBeNull();
  });
});