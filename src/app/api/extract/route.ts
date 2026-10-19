import { NextResponse } from "next/server";
import {
  consumeRateLimit,
  databaseConfigured,
  ipRateKey,
  requestIp,
} from "@/lib/server-api";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const maxDuration = 30;

function contentMatchesType(bytes: Uint8Array, type: string): boolean {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (type === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PHOTO_BYTES + 64 * 1024) {
    return NextResponse.json(
      { error: "PHOTO_TOO_LARGE", message: "Foto harus berukuran maksimal 4 MB." },
      { status: 400 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return NextResponse.json(
      { error: "INVALID_REQUEST_TYPE", message: "Kirim foto sebagai formulir multipart." },
      { status: 400 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json(
        { error: "INVALID_MULTIPART", message: "Formulir foto tidak dapat dibaca." },
        { status: 400 },
      );
    }
    throw error;
  }
  const photo = form.get("photo");
  if (!(photo instanceof File)) {
    return NextResponse.json(
      { error: "PHOTO_REQUIRED", message: "Pilih foto JPEG, PNG, atau WebP." },
      { status: 400 },
    );
  }
  if (photo.size === 0 || photo.size > MAX_PHOTO_BYTES) {
    return NextResponse.json(
      { error: "PHOTO_TOO_LARGE", message: "Foto harus berukuran maksimal 4 MB." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await photo.arrayBuffer());
  if (!contentMatchesType(bytes, photo.type)) {
    return NextResponse.json(
      { error: "INVALID_PHOTO_TYPE", message: "Isi berkas harus berupa JPEG, PNG, atau WebP." },
      { status: 400 },
    );
  }

  if (databaseConfigured()) {
    if (!process.env.IP_HASH_SALT) {
      return NextResponse.json(
        { error: "RATE_LIMIT_NOT_CONFIGURED", message: "Ekstraksi manual tersedia; pembatasan belum dikonfigurasi." },
        { status: 503 },
      );
    }
    const allowed = await consumeRateLimit(ipRateKey(await requestIp()), 10);
    if (!allowed) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: "Batas ekstraksi per jam tercapai. Coba lagi nanti." },
        { status: 429 },
      );
    }
  }

  return NextResponse.json(
    {
      error: "MODEL_NOT_CONFIGURED",
      message: "Ekstraksi otomatis belum tersedia. Foto tidak disimpan; isi formulir secara manual.",
      manualEntryAvailable: true,
    },
    { status: 503 },
  );
}
