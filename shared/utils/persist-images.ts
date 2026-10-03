import {
  LISTING_COVER_HEIGHT,
  LISTING_COVER_WIDTH,
  coverCropRect,
} from "@/shared/utils/listing-image-cover";
import { MAX_LISTING_IMAGES } from "@/shared/constants/listing-media";
import { UPLOAD_MAX_BYTES } from "@/services/storage/types";
import {
  IMAGE_HEIC_ERROR,
  IMAGE_PROCESS_ERROR,
  IMAGE_READ_ERROR,
  IMAGE_TOO_LARGE_ERROR,
  isRasterImageKind,
  mimeForRasterKind,
  sniffRasterImageKind,
  withNormalizedImageFile,
  type RasterImageKind,
} from "@/shared/media/image-bytes";

const JPEG_QUALITY = 0.78;
const MAX_IMAGES = MAX_LISTING_IMAGES;
const DECODE_HEAD_BYTES = 32;

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
};

async function sniffFileKind(file: File): Promise<RasterImageKind | "heic" | "unknown"> {
  const head = new Uint8Array(await file.slice(0, DECODE_HEAD_BYTES).arrayBuffer());
  return sniffRasterImageKind(head);
}

async function asDecodableFile(file: File): Promise<{
  file: File;
  kind: RasterImageKind | "heic" | "unknown";
}> {
  const kind = await sniffFileKind(file);
  if (kind === "heic") {
    throw new Error(IMAGE_HEIC_ERROR);
  }
  let next = withNormalizedImageFile(file);
  if (isRasterImageKind(kind) && next.type !== mimeForRasterKind(kind)) {
    const mime = mimeForRasterKind(kind);
    const ext = mime === "image/jpeg" ? "jpg" : mime.slice("image/".length);
    const base = next.name.replace(/\.[^.]+$/, "") || "listing";
    next = new File([next], `${base}.${ext}`, {
      type: mime,
      lastModified: next.lastModified,
    });
  }
  return { file: next, kind };
}

async function decodeWithImageBitmap(blob: Blob): Promise<DecodedImage | null> {
  if (typeof createImageBitmap !== "function") return null;
  const options = { imageOrientation: "from-image" as const };
  try {
    const bitmap = await createImageBitmap(blob, options);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  } catch {
    try {
      const bitmap = await createImageBitmap(blob);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      return null;
    }
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(IMAGE_READ_ERROR));
    image.src = src;
  });
}

async function decodeWithHtmlImage(blob: Blob): Promise<DecodedImage> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadHtmlImage(objectUrl);
    if (typeof image.decode === "function") {
      try {
        await image.decode();
      } catch {
        throw new Error(IMAGE_READ_ERROR);
      }
    }
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) {
      throw new Error(IMAGE_READ_ERROR);
    }
    return { source: image, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function decodeListingImage(blob: Blob): Promise<DecodedImage> {
  const bitmap = await decodeWithImageBitmap(blob);
  if (bitmap) return bitmap;
  return decodeWithHtmlImage(blob);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(IMAGE_PROCESS_ERROR));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

function keepOriginalIfSafe(file: File, kind: RasterImageKind | "heic" | "unknown"): File {
  if (file.size > UPLOAD_MAX_BYTES) {
    throw new Error(IMAGE_TOO_LARGE_ERROR);
  }
  if (!isRasterImageKind(kind) && !LISTING_SAFE_FALLBACK_TYPES.has(file.type)) {
    throw new Error(IMAGE_READ_ERROR);
  }
  return file;
}

const LISTING_SAFE_FALLBACK_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Center-crop + resize any listing photo to the shared 3:2 cover frame
 * so every ad image lands at the same marketplace size.
 *
 * JPEG is allowed — decode uses createImageBitmap first (orientation-aware),
 * then HTML Image. Valid JPEG/PNG/WebP/GIF that still fail canvas decode
 * are kept as the original bytes with a corrected MIME rather than rejected.
 */
export async function normalizeListingImageFile(file: File): Promise<File> {
  const prepared = await asDecodableFile(file);

  let decoded: DecodedImage;
  try {
    decoded = await decodeListingImage(prepared.file);
  } catch {
    return keepOriginalIfSafe(prepared.file, prepared.kind);
  }

  try {
    const crop = coverCropRect(decoded.width, decoded.height);
    const canvas = document.createElement("canvas");
    canvas.width = LISTING_COVER_WIDTH;
    canvas.height = LISTING_COVER_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error(IMAGE_PROCESS_ERROR);
    }
    context.drawImage(
      decoded.source,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      LISTING_COVER_WIDTH,
      LISTING_COVER_HEIGHT,
    );
    const blob = await canvasToBlob(canvas);
    const baseName = prepared.file.name.replace(/\.[^.]+$/, "") || "listing";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === IMAGE_PROCESS_ERROR) {
      throw error;
    }
    return keepOriginalIfSafe(prepared.file, prepared.kind);
  } finally {
    decoded.close?.();
  }
}

async function fileToDataUrl(file: File): Promise<string> {
  const normalized = await normalizeListingImageFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error(IMAGE_READ_ERROR));
    };
    reader.onerror = () => reject(new Error(IMAGE_READ_ERROR));
    reader.readAsDataURL(normalized);
  });
}

export async function persistImageFiles(files: File[]): Promise<string[]> {
  const selected = files.slice(0, MAX_IMAGES);
  return Promise.all(selected.map((file) => fileToDataUrl(file)));
}

export async function normalizeListingImageFiles(
  files: File[],
): Promise<File[]> {
  const selected = files.slice(0, MAX_IMAGES);
  return Promise.all(selected.map((file) => normalizeListingImageFile(file)));
}
