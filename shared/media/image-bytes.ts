/** Raster sniffing + MIME aliases for listing and evidence uploads. */

export type RasterImageKind = "jpeg" | "png" | "webp" | "gif";

export const IMAGE_READ_ERROR = "تعذر قراءة الصورة";
export const IMAGE_PROCESS_ERROR = "تعذر معالجة الصورة";
export const IMAGE_TOO_LARGE_ERROR =
  "حجم الصورة كبير جداً (الحد تقريباً 4.5MB لكل ملف).";
export const IMAGE_HEIC_ERROR =
  "صيغة HEIC غير مدعومة. احفظ الصورة كـ JPEG أو PNG ثم أعد الرفع.";

export const LISTING_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** File picker accept — JPEG/JPG aliases + PNG/WebP/GIF, not a blanket image/*. */
export const LISTING_IMAGE_ACCEPT = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  ".jpg",
  ".jpeg",
  ".jpe",
  ".jfif",
  ".png",
  ".webp",
  ".gif",
].join(",");

const JPEG_ALIASES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/jfif",
  "image/pjpg",
  "image/x-citrix-jpeg",
]);

const PNG_ALIASES = new Set(["image/png", "image/x-png"]);
const WEBP_ALIASES = new Set(["image/webp", "image/x-webp"]);
const GIF_ALIASES = new Set(["image/gif"]);

const HEIC_BRANDS = new Set([
  "heic",
  "heif",
  "heix",
  "hevc",
  "hevx",
  "mif1",
  "msf1",
]);

function byte(bytes: ArrayLike<number>, index: number): number {
  return Number(bytes[index] ?? 0);
}

function ascii(bytes: ArrayLike<number>, start: number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += String.fromCharCode(byte(bytes, start + i));
  }
  return out;
}

export function mimeForRasterKind(kind: RasterImageKind): string {
  switch (kind) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
  }
}

export function isRasterImageKind(
  value: string,
): value is RasterImageKind {
  return (
    value === "jpeg" || value === "png" || value === "webp" || value === "gif"
  );
}

/**
 * Magic-byte sniff. JPEG is FFD8FF (SOI) — progressive, EXIF, and CMYK
 * JPEGs all share this header. HEIC/HEIF uses ISO-BMFF `ftyp`.
 */
export function sniffRasterImageKind(
  bytes: ArrayLike<number>,
): RasterImageKind | "heic" | "unknown" {
  const length = bytes.length;
  if (length >= 3 && byte(bytes, 0) === 0xff && byte(bytes, 1) === 0xd8 && byte(bytes, 2) === 0xff) {
    return "jpeg";
  }
  if (
    length >= 8 &&
    byte(bytes, 0) === 0x89 &&
    byte(bytes, 1) === 0x50 &&
    byte(bytes, 2) === 0x4e &&
    byte(bytes, 3) === 0x47 &&
    byte(bytes, 4) === 0x0d &&
    byte(bytes, 5) === 0x0a &&
    byte(bytes, 6) === 0x1a &&
    byte(bytes, 7) === 0x0a
  ) {
    return "png";
  }
  if (length >= 6) {
    const header = ascii(bytes, 0, 6);
    if (header === "GIF87a" || header === "GIF89a") return "gif";
  }
  if (
    length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 4) === "WEBP"
  ) {
    return "webp";
  }
  if (length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4).toLowerCase();
    if (HEIC_BRANDS.has(brand)) return "heic";
  }
  return "unknown";
}

export function extensionForImageMime(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

function extensionFromFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const dot = base.lastIndexOf(".");
  if (dot < 0) return "";
  return base.slice(dot).toLowerCase();
}

function mimeFromExtension(filename: string): string | null {
  const ext = extensionFromFilename(filename);
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".jpe" || ext === ".jfif") {
    return "image/jpeg";
  }
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".heic" || ext === ".heif") return "image/heic";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".pdf") return "application/pdf";
  return null;
}

function mimeFromDeclared(declaredType: string): string | null {
  const raw = declaredType.trim().toLowerCase();
  if (!raw) return null;
  if (JPEG_ALIASES.has(raw)) return "image/jpeg";
  if (PNG_ALIASES.has(raw)) return "image/png";
  if (WEBP_ALIASES.has(raw)) return "image/webp";
  if (GIF_ALIASES.has(raw)) return "image/gif";
  if (raw === "image/heic" || raw === "image/heif") return "image/heic";
  return raw;
}

/**
 * Normalize browser MIME aliases (`image/jpg`, `image/pjpeg`, empty type)
 * using the filename when the OS leaves type blank or `octet-stream`.
 */
export function normalizeDeclaredImageMime(
  declaredType: string,
  filename = "",
): string | null {
  const declared = mimeFromDeclared(declaredType);
  if (
    declared &&
    declared !== "application/octet-stream" &&
    declared !== "binary/octet-stream"
  ) {
    return declared;
  }
  return mimeFromExtension(filename);
}

/**
 * Resolve the content type for `/api/uploads`. Magic bytes win for rasters
 * so a JPEG named `.png` or tagged `image/jpg` still stores as `image/jpeg`.
 */
export function resolveUploadContentType(input: {
  declaredType?: string;
  filename?: string;
  bytes: ArrayLike<number>;
}): string {
  const sniffed = sniffRasterImageKind(input.bytes);
  if (sniffed === "heic") return "image/heic";
  if (isRasterImageKind(sniffed)) return mimeForRasterKind(sniffed);
  return (
    normalizeDeclaredImageMime(input.declaredType ?? "", input.filename ?? "") ||
    "application/octet-stream"
  );
}

export function isLikelyListingImageFile(file: {
  name?: string;
  type?: string;
}): boolean {
  const mime = normalizeDeclaredImageMime(file.type ?? "", file.name ?? "");
  return Boolean(mime && LISTING_IMAGE_MIME_TYPES.has(mime));
}

/** Keep JPEG/PNG/WebP even when the OS left MIME empty or wrong. */
export async function collectListingImageFiles(
  files: ArrayLike<File> | null | undefined,
): Promise<File[]> {
  const out: File[] = [];
  for (const file of Array.from(files ?? [])) {
    if (isLikelyListingImageFile(file)) {
      out.push(withNormalizedImageFile(file));
      continue;
    }
    const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    const kind = sniffRasterImageKind(head);
    if (!isRasterImageKind(kind)) continue;
    const mime = mimeForRasterKind(kind);
    const ext = extensionForImageMime(mime);
    const name =
      file.name && file.name.includes(".") ? file.name : `image.${ext}`;
    out.push(
      new File([file], name, { type: mime, lastModified: file.lastModified }),
    );
  }
  return out;
}

/** Rewrite `image/jpg` / empty MIME so blob URLs and decoders see `image/jpeg`. */
export function withNormalizedImageFile(file: File): File {
  const nextType = normalizeDeclaredImageMime(file.type, file.name);
  if (!nextType || nextType === file.type) return file;
  const ext = extensionForImageMime(nextType);
  const base = file.name.replace(/\.[^.]+$/, "") || file.name || "image";
  const name = file.name.toLowerCase().endsWith(`.${ext}`)
    ? file.name
    : `${base}.${ext}`;
  return new File([file], name, {
    type: nextType,
    lastModified: file.lastModified,
  });
}
