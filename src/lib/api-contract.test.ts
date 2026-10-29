import { describe, expect, it } from "vitest";
import {
  boardSchema,
  boardToApi,
  boardToInternal,
  dossierStatusToApi,
  statusToApi,
  storedBoardSchema,
} from "./api-contract";

const board = {
  packageName: "Rehabilitasi Jalan Desa Sukamaju",
  supplier: "PT Bangun Jaya",
  contractValue: 150_000_000,
  durationDays: 120,
  fiscalYear: 2026,
  fundingSource: "DAK",
  agencyUnit: "DPUPR",
  contractNumber: "123/DPUPR/2026",
  contractDate: "2026-07-11",
  locationText: "Desa Sukamaju",
  executionStartDate: "2026-07-11",
  executionEndDate: "2026-11-07",
  locationLatitude: -6.2,
  locationLongitude: 106.6,
};

describe("English API board contract", () => {
  it("validates and maps the API shape to internal matching fields", () => {
    const parsed = boardSchema.parse(board);
    expect(boardToInternal(parsed)).toEqual({
      nama_paket: board.packageName,
      penyedia: board.supplier,
      nilai_kontrak: board.contractValue,
      masa_hari: board.durationDays,
      tahun_anggaran: board.fiscalYear,
      sumber_dana: board.fundingSource,
      satuan_kerja: board.agencyUnit,
      nomor_kontrak: board.contractNumber,
      tanggal_kontrak: board.contractDate,
      lokasi_teks: board.locationText,
      masa_mulai: board.executionStartDate,
      masa_selesai: board.executionEndDate,
      lokasi_lat: board.locationLatitude,
      lokasi_lng: board.locationLongitude,
    });
    expect(boardToApi(boardToInternal(parsed))).toEqual(parsed);
  });

  it("rejects an invalid date and negative contract value", () => {
    expect(boardSchema.safeParse({ ...board, contractDate: "11-07-2026" }).success).toBe(false);
    expect(boardSchema.safeParse({ ...board, contractValue: -1 }).success).toBe(false);
    expect(boardSchema.safeParse({ ...board, locationLatitude: 91 }).success).toBe(false);
  });

  it("keeps projects saved before date-range and map-pin fields readable", () => {
    const oldBoard = boardToApi(
      storedBoardSchema.parse({
        nama_paket: board.packageName,
        penyedia: board.supplier,
        nilai_kontrak: board.contractValue,
        masa_hari: board.durationDays,
        tahun_anggaran: board.fiscalYear,
        sumber_dana: board.fundingSource,
        satuan_kerja: board.agencyUnit,
        nomor_kontrak: board.contractNumber,
        tanggal_kontrak: board.contractDate,
        lokasi_teks: board.locationText,
      }),
    );
    expect(oldBoard.executionStartDate).toBeNull();
    expect(oldBoard.executionEndDate).toBeNull();
    expect(oldBoard.locationLatitude).toBeNull();
    expect(oldBoard.locationLongitude).toBeNull();
  });

  it("exposes stable English status values", () => {
    expect(statusToApi("cocok")).toBe("matched");
    expect(statusToApi("selisih")).toBe("discrepancy");
    expect(statusToApi("tidak_ditemukan")).toBe("not_found");
    expect(dossierStatusToApi("catatan_resmi")).toBe("official_record");
  });
});
