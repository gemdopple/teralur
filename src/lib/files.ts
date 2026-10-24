// Pure file-type detection from magic bytes per PRD Lampiran J.1.
// No I/O. file.type and the filename extension are ignored upstream —
// this is the only source of truth for the upload pipeline.

export type Detected = {
  mime: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  ext: "jpg" | "png" | "webp" | "pdf";
  kind: "photo" | "document";
} | null;

export function detectFile(b: Uint8Array): Detected {
  const startsWith = (sig: number[], off = 0) => sig.every((v, i) => b[off + i] === v);
  if (b.length >= 3 && startsWith([0xff, 0xd8, 0xff]))
    return { mime: "image/jpeg", ext: "jpg", kind: "photo" };
  if (b.length >= 8 && startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { mime: "image/png", ext: "png", kind: "photo" };
  if (b.length >= 12 && startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8))
    return { mime: "image/webp", ext: "webp", kind: "photo" };
  if (b.length >= 5 && startsWith([0x25, 0x50, 0x44, 0x46, 0x2d]))
    return { mime: "application/pdf", ext: "pdf", kind: "document" };
  return null;
}
