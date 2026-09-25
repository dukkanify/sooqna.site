import { persistImageFiles } from "@/shared/utils/persist-images";

type UploadApiResponse = {
  url?: string;
  provider?: string;
  error?: string;
  preferClientPersist?: boolean;
};

/**
 * Listing image upload helper.
 * Prefer durable server URLs (S3). On ephemeral local/media paths, compress
 * to data URLs so seller photos survive in listing JSON (Postgres).
 */
export async function uploadListingImages(files: File[]): Promise<string[]> {
  if (typeof window === "undefined") {
    return persistImageFiles(files);
  }

  const urls: string[] = [];
  let preferClientPersist = false;

  for (const file of files) {
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

  if (!preferClientPersist && urls.length === files.length) {
    return urls;
  }

  return persistImageFiles(files);
}
