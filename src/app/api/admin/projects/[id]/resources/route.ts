import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError, jsonOk } from "@/lib/admin-http";
import { detectFile } from "@/lib/files";
import { getSupabaseAdmin } from "@/lib/db";
import { deviceRateKey, consumeRateLimit } from "@/lib/server-api";
import { ResourceMetaSchema } from "@/lib/schemas";
import { firstMessage, zodDetails } from "@/lib/admin-projects";

// Unggah resource proyek admin (T-44, Lampiran J.2 / E.8). Rute multipart:
// TIDAK memakai isJsonRequest. Urutan langkah persis J.2 — requireAdmin
// paling awal, sebelum body dibaca. Catatan: J.2 menyuruh `export const
// runtime = "nodejs"`, tetapi Next.js terpasang (cacheComponents aktif)
// MENOLAK route segment config `runtime` (build error) — runtime Node adalah
// default, jadi ekspor itu dilepas (lihat docs/agent-notes.md).
const BUCKET = "resources";
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();

    // 2. Proyek harus ada dan tidak dinonaktifkan.
    const { id } = await params;
    const { data: submission, error: fetchError } = await getSupabaseAdmin()
      .from("submissions")
      .select("id, dinonaktifkan")
      .eq("id", id)
      .eq("jenis", "admin")
      .maybeSingle();
    if (fetchError) throw new Error(`Project lookup failed: ${fetchError.message}`);
    if (!submission || submission.dinonaktifkan) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }

    // 3. Multipart form + validasi meta (zod, Lampiran D).
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError("VALIDATION_ERROR", 422, "Berkas wajib diisi.");
    }
    const meta = ResourceMetaSchema.safeParse({
      title: form.get("title"),
      kind: form.get("kind"),
    });
    if (!meta.success) {
      return jsonError("VALIDATION_ERROR", 422, firstMessage(meta.error), zodDetails(meta.error));
    }

    // 4. Pembatasan: 30 unggahan per jam per akun admin (7.5), kunci hash
    // asin dari id pengguna (IP_HASH_SALT), pola sama dengan pembatasan publik.
    const allowed = await consumeRateLimit(deviceRateKey(user.id), 30);
    if (!allowed) {
      return jsonError("RATE_LIMITED", 429, "Batas unggah per jam tercapai. Coba lagi nanti.");
    }

    // 5. Ukuran.
    if (file.size === 0) {
      return jsonError("INVALID_FILE", 400, "Berkas kosong atau rusak.");
    }
    if (file.size > MAX_BYTES) {
      return jsonError("INVALID_FILE", 400, "Berkas terlalu besar. Maksimal 4 MB.");
    }

    // 6. Batas 10 resource per proyek.
    const supabase = getSupabaseAdmin();
    const { count, error: countError } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", id);
    if (countError) throw new Error(`Resource count failed: ${countError.message}`);
    if ((count ?? 0) >= 10) {
      return jsonError("INVALID_FILE", 400, "Proyek ini sudah memuat 10 berkas. Hapus satu dulu.");
    }

    // 7. Deteksi tipe dari isi (J.1) — file.type dan ekstensi diabaikan.
    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectFile(bytes);
    if (!detected) {
      return jsonError("INVALID_FILE", 400, "Berkas harus berupa foto JPEG, PNG, WebP, atau PDF.");
    }
    if (detected.kind !== meta.data.kind) {
      return jsonError("INVALID_FILE", 400, "Jenis berkas tidak cocok dengan isinya.");
    }

    // 8. Foto: terapkan orientasi EXIF (rotate) dan kecilkan sisi terpanjang
    // 2000 px, keluar di format yang sama TANPA metadata (EXIF dibuang —
    // jangan memanggil withMetadata). PDF: simpan apa adanya (batas yang
    // dicatat: metadata PDF tidak dibersihkan).
    let payload: Buffer;
    let ukuran: number;
    if (detected.kind === "photo") {
      const pipelined = sharp(bytes)
        .rotate()
        .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true });
      if (detected.mime === "image/jpeg") payload = await pipelined.jpeg({ quality: 82 }).toBuffer();
      else if (detected.mime === "image/webp") payload = await pipelined.webp({ quality: 80 }).toBuffer();
      else payload = await pipelined.png().toBuffer();
      ukuran = payload.byteLength;
      if (ukuran > MAX_BYTES) {
        return jsonError("INVALID_FILE", 400, "Berkas terlalu besar. Maksimal 4 MB.");
      }
    } else {
      payload = Buffer.from(bytes);
      ukuran = payload.byteLength;
    }

    // 9. Nama objek acak; unggah ke bucket `resources` dengan service role.
    const path = `${id}/${randomBytes(16).toString("hex")}.${detected.ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, payload, { contentType: detected.mime, upsert: false });
    if (uploadError) throw new Error(`Resource upload failed: ${uploadError.message}`);

    // 10. Insert baris; gagal -> hapus objek yang baru diunggah, 500 INTERNAL.
    const { data: inserted, error: insertError } = await supabase
      .from("resources")
      .insert({
        submission_id: id,
        jenis: detected.kind,
        judul: meta.data.title,
        path_penyimpanan: path,
        ukuran,
        tipe_mime: detected.mime,
      })
      .select("id, jenis, judul, ukuran, dibuat")
      .single();
    if (insertError || !inserted) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw new Error(`Resource insert failed: ${insertError?.message ?? "no row"}`);
    }

    // 11. Perbarui diperbarui (trigger juga berjalan; update eksplisit aman).
    await supabase.from("submissions").update({ diperbarui: new Date().toISOString() }).eq("id", id);

    // 12. Respons 201 sesuai E.8.
    const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    return jsonOk(
      {
        resource: {
          id: inserted.id,
          kind: inserted.jenis,
          title: inserted.judul,
          url,
          size: inserted.ukuran,
          createdAt: inserted.dibuat,
        },
      },
      201,
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}
