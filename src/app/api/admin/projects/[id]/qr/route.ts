import { requireAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, jsonError } from "@/lib/admin-http";
import { getSupabaseAdmin } from "@/lib/db";
import { qrPng, qrSvg } from "@/lib/qr";
import { z } from "zod";

// Unduh QR dossier (T-46, Lampiran K / E.10). Respons gambar, bukan JSON.
// Proyek draf tetap boleh diunduh QR-nya (slug stabil sejak dibuat).
// format default svg; nilai lain -> 400 VALIDATION_ERROR. ?download=1 ->
// Content-Disposition: attachment.

const formatSchema = z.enum(["svg", "png"]);
const idSchema = z.string().uuid();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;
    if (!idSchema.safeParse(id).success) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }
    const url = new URL(request.url);
    const format = formatSchema.safeParse(url.searchParams.get("format") ?? "svg");
    if (!format.success) {
      return jsonError("VALIDATION_ERROR", 400, "Format harus svg atau png.");
    }

    const { data: submission, error: fetchError } = await getSupabaseAdmin()
      .from("submissions")
      .select("slug, dinonaktifkan")
      .eq("id", id)
      .eq("jenis", "admin")
      .maybeSingle();
    if (fetchError) throw new Error(`Project lookup failed: ${fetchError.message}`);
    if (!submission || submission.dinonaktifkan) {
      return jsonError("NOT_FOUND", 404, "Proyek tidak ditemukan.");
    }

    const download = url.searchParams.get("download") === "1";
    const disposition = download ? "attachment" : "inline";

    try {
      if (format.data === "png") {
        const png = await qrPng(submission.slug);
        return new Response(new Uint8Array(png), {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `${disposition}; filename="qr-${submission.slug}.png"`,
            "Cache-Control": "no-store",
          },
        });
      }
      const svg = await qrSvg(submission.slug);
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `${disposition}; filename="qr-${submission.slug}.svg"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      // NEXT_PUBLIC_SITE_URL belum diatur -> jangan membuat QR alamat lokal (K.1).
      if (error instanceof Error && error.message.includes("NEXT_PUBLIC_SITE_URL")) {
        return jsonError("INTERNAL", 500, "Alamat situs belum diatur");
      }
      throw error;
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}
