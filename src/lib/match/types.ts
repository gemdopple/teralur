export type Papan = {
  nama_paket: string | null;
  penyedia: string | null;
  nilai_kontrak: number | null;
  masa_hari: number | null;
  tahun_anggaran: number | null;
  sumber_dana: string | null;
  satuan_kerja: string | null;
  nomor_kontrak: string | null;
  tanggal_kontrak: string | null;
  lokasi_teks: string | null;
  masa_mulai?: string | null;
  masa_selesai?: string | null;
  lokasi_lat?: number | null;
  lokasi_lng?: number | null;
};
export type RecordResmi = {
  id: string;
  nama_paket: string;
  penyedia: string | null;
  nilai_kontrak: number;
  tanggal_kontrak: string | null;
  masa_hari: number | null;
  tahun: number | null;
};
export type Status = "cocok" | "selisih" | "tidak_ditemukan";
export type Label = "tercatat" | "hitungan" | "belum_diketahui";
