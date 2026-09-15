import { persistImageFiles } from "@/shared/utils/persist-images";

/**
 * Listing image upload helper.
 * Prefer server `/api/uploads` when available; otherwise compress to data URLs.
 */
export async function uploadListingImages(files: File[]): Promise<string[]> {
  if (typeof window !== "undefined") {
    const urls: string[] = [];
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
        if (response.ok) {
          const data = (await response.json()) as { url?: string };
          if (data.url) {
            urls.push(data.url);
            continue;
          }
        }
      } catch {
        // fall through to local compression
      }
    }
    if (urls.length === files.length) return urls;
  }

  const provider = process.env.NEXT_PUBLIC_UPLOAD_PROVIDER;
  if (provider && provider !== "local") {
    console.warn(
      `[upload] Provider "${provider}" not fully wired — falling back to local compression.`,
    );
  }

  return persistImageFiles(files);
}
