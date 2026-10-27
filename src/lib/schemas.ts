import { z } from "zod";

// Skema zod untuk API admin sesuai PRD v1.1 Lampiran D.1. Murni (tanpa I/O)
// agar dapat diuji unit — aturan PATCH diimplementasikan sebagai fungsi murni
// `mergePatch` (kunci diambil dari body mentah, kunci yang dikirim null
// berarti "kosongkan", kunci yang tidak dikirim tidak disentuh).

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus TTTT-BB-HH")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Tanggal tidak valid");

// Catatan: transform di bawah mengubah undefined menjadi null.
// Untuk PATCH jangan memakai hasil parse pada kunci yang tidak dikirim.
const nullableText = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));

const nullableInt = (min: number, max: number) =>
  z.number().int().min(min).max(max).nullish().transform((v) => v ?? null);

export const BoardSchema = z.object({
  packageName: nullableText(300),
  supplier: nullableText(200),
  contractValue: nullableInt(1, 1_000_000_000_000_000),
  durationDays: nullableInt(1, 3650),
  fiscalYear: nullableInt(2000, 2100),
  fundingSource: nullableText(200),
  agencyUnit: nullableText(200),
  contractNumber: nullableText(100),
  contractDate: isoDate.nullish().transform((v) => v ?? null),
  locationText: nullableText(300),
});
export type Board = z.infer<typeof BoardSchema>;

// Papan: hanya nama paket yang wajib (menjadi judul dossier)
export const AdminBoardSchema = BoardSchema.extend({
  packageName: z.string().trim().min(1, "Nama paket wajib diisi").max(300),
});

// Catatan resmi TIDAK lagi diketik manual: proyek menautkan satu baris
// registry (`records`, diimpor dari data pengadaan independen) lewat
// recordId. Tanpa tautan, status jujur menjadi "tidak ditemukan" sampai
// datanya diimpor — mencegah pembuat proyek mengisi kedua sisi sendiri.
export const AdminProjectCreateSchema = z.object({
  board: AdminBoardSchema,
  recordId: z.string().uuid().nullish(),
  featured: z.boolean().optional().default(false),
  // Penugasan ke satu kontraktor (opsional; null = belum ditugaskan).
  contractorId: z.string().uuid().nullish(),
});

export const AdminProjectPatchSchema = z
  .object({
    board: BoardSchema.partial().optional(),
    // null = lepas tautan registry; undefined = biarkan; uuid = tautkan ulang.
    recordId: z.string().uuid().nullable().optional(),
    featured: z.boolean().optional(),
    contractorId: z.string().uuid().nullish(),
  })
  .refine((v) => Object.keys(v).length > 0, "Tidak ada perubahan");

// Kata sandi akun. Opsional pada PATCH: kosong berarti "jangan ubah".
const KataSandiBaru = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter")
  .max(200, "Kata sandi maksimal 200 karakter");

// Pembuatan akun kontraktor oleh admin (nama perusahaan + kredensial login).
export const ContractorCreateSchema = z.object({
  nama: z.string().trim().min(1, "Nama kontraktor wajib diisi").max(200),
  kontak: z.string().trim().max(200).nullish().transform((v) => (v ? v : null)),
  email: z.string().trim().toLowerCase().email("Format email tidak valid").max(200),
  password: KataSandiBaru,
});

// Ubah akun kontraktor. Semua opsional; `password` kosong/tidak dikirim berarti
// kata sandi lama dipertahankan. Minimal satu perubahan.
export const ContractorUpdateSchema = z
  .object({
    nama: z.string().trim().min(1, "Nama kontraktor wajib diisi").max(200).optional(),
    kontak: z.string().trim().max(200).nullish().transform((v) => (v ? v : null)),
    email: z.string().trim().toLowerCase().email("Format email tidak valid").max(200).optional(),
    password: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine((v) => v === undefined || (v.length >= 8 && v.length <= 200), {
        message: "Kata sandi minimal 8 karakter",
      }),
  })
  .refine(
    (v) => v.nama !== undefined || v.kontak !== null || v.email !== undefined || v.password !== undefined,
    "Tidak ada perubahan",
  );

// Akun pemerintah: tidak punya entitas tersendiri seperti `contractors`, jadi
// yang disimpan adalah label (`profiles.nama`) + kredensial login.
export const PemerintahCreateSchema = z.object({
  nama: z.string().trim().min(1, "Nama akun wajib diisi").max(200),
  email: z.string().trim().toLowerCase().email("Format email tidak valid").max(200),
  password: KataSandiBaru,
});

export const PemerintahUpdateSchema = z
  .object({
    nama: z.string().trim().min(1, "Nama akun wajib diisi").max(200).optional(),
    email: z.string().trim().toLowerCase().email("Format email tidak valid").max(200).optional(),
    password: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine((v) => v === undefined || (v.length >= 8 && v.length <= 200), {
        message: "Kata sandi minimal 8 karakter",
      }),
  })
  .refine(
    (v) => v.nama !== undefined || v.email !== undefined || v.password !== undefined,
    "Tidak ada perubahan",
  );

export const ResourceMetaSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(120),
  kind: z.enum(["photo", "document"]),
});

/**
 * Aturan PATCH (Lampiran D.1), sebagai fungsi murni agar dapat diuji unit:
 * gabungkan ke data tersimpan HANYA kunci yang ada di body mentah. Kunci yang
 * dikirim `null` berarti "kosongkan"; kunci yang tidak dikirim tetap memakai
 * nilai tersimpan. `parsedPatch` berasal dari zod (kunci tak dikenal sudah
 * dibuang), sehingga kunci mentah yang tidak ada di hasil parse (mis. kunci
 * asing) juga tidak digabungkan. Tidak mengubah `current` maupun `parsedPatch`.
 */
export function mergePatch<T extends object>(
  current: T,
  rawPatch: Record<string, unknown>,
  parsedPatch: Record<string, unknown>,
): T {
  const result: T = { ...current };
  for (const key of Object.keys(rawPatch)) {
    if (Object.prototype.hasOwnProperty.call(parsedPatch, key)) {
      (result as Record<string, unknown>)[key] = parsedPatch[key];
    }
  }
  return result;
}
