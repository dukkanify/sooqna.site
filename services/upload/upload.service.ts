import {
  normalizeListingImageFiles,
  persistImageFiles,
} from "@/shared/utils/persist-images";
import { IMAGE_READ_ERROR } from "@/shared/media/image-bytes";

type UploadApiResponse = {
  url?: string;
  provider?: string;
  error?: string;
  preferClientPersist?: boolean;
};

/**
 * Listing image upload helper.
 * Normalize every photo to the shared 3:2 cover size first, then prefer
 * durable server URLs (Vercel Blob / S3). On ephemeral local/media paths,
 * compress to data URLs so seller photos survive in listing JSON (Postgres).
 */
export async function uploadListingImages(files: File[]): Promise<string[]> {
  if (typeof window === "undefined") {
    return persistImageFiles(files);
  }

  const normalized = await normalizeListingImageFiles(files);
  const urls: string[] = [];
  let preferClientPersist = false;

  for (const file of normalized) {
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "listings");
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const data = (await response.json().catch(() => ({}))) as UploadApiResponse;

      if (response.status === 503 && data.preferClientPersist) {
        preferClientPersist = true;
        break;
      }

      if (response.ok && data.url) {
        // Local /api/media paths can vanish on serverless — treat as ephemeral.
        if (
          data.provider === "local" ||
          data.url.startsWith("/api/media/")
        ) {
          preferClientPersist = true;
          break;
        }
        urls.push(data.url);
        continue;
      }
    } catch {
      // fall through to local compression
    }
  }

  if (!preferClientPersist && urls.length === normalized.length) {
    return urls;
  }

  // Already normalized — write data URLs without a second canvas pass.
  return Promise.all(
    normalized.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
              return;
            }
            reject(new Error(IMAGE_READ_ERROR));
          };
          reader.onerror = () => reject(new Error(IMAGE_READ_ERROR));
          reader.readAsDataURL(file);
        }),
    ),
  );
}
