import {
  LISTING_COVER_HEIGHT,
  LISTING_COVER_WIDTH,
  coverCropRect,
} from "@/shared/utils/listing-image-cover";

const JPEG_QUALITY = 0.78;
const MAX_IMAGES = 6;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("تعذر قراءة الصورة"));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("تعذر معالجة الصورة"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/**
 * Center-crop + resize any listing photo to the shared 3:2 cover frame
 * so every ad image lands at the same marketplace size.
 */
export async function normalizeListingImageFile(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const crop = coverCropRect(image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = LISTING_COVER_WIDTH;
    canvas.height = LISTING_COVER_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("تعذر معالجة الصورة");
    }
    context.drawImage(
      image,
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
    const baseName = file.name.replace(/\.[^.]+$/, "") || "listing";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
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
      reject(new Error("تعذر قراءة الصورة"));
    };
    reader.onerror = () => reject(new Error("تعذر قراءة الصورة"));
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
