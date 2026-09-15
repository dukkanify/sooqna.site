export type StorageVisibility = "public" | "private";

export type MediaClass = "listing" | "evidence" | "dispute" | "general";

export type StoredObject = {
  key: string;
  url: string;
  contentType: string;
  byteSize: number;
  provider: "local" | "s3";
  visibility: StorageVisibility;
  mediaClass: MediaClass;
};

export type UploadInput = {
  buffer: Buffer;
  contentType: string;
  folder?: string;
  mediaClass?: MediaClass;
  visibility?: StorageVisibility;
  /** Optional stable key prefix (e.g. user/order id) for ownership scoping. */
  ownerScope?: string;
};

export type ObjectStorageProvider = {
  readonly name: "local" | "s3";
  upload(input: UploadInput): Promise<StoredObject>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
  /** Short-lived signed URL for private objects. */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  getObjectBuffer?(
    key: string,
  ): Promise<{ buffer: Buffer; contentType: string } | null>;
};

export const UPLOAD_MAX_BYTES = 4_500_000;

export const UPLOAD_ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

export function extensionFor(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

export function normalizeObjectKey(key: string): string | null {
  const normalized = key.replace(/^\/+/, "").replace(/\.\./g, "");
  if (!normalized || normalized.includes("\0")) return null;
  return normalized;
}

export function resolveMediaClass(folder?: string): MediaClass {
  const root = (folder ?? "general").split("/")[0];
  if (root === "listings" || root === "listing") return "listing";
  if (root === "evidence") return "evidence";
  if (root === "disputes" || root === "dispute") return "dispute";
  return "general";
}

export function defaultVisibilityFor(
  mediaClass: MediaClass,
): StorageVisibility {
  return mediaClass === "listing" || mediaClass === "general"
    ? "public"
    : "private";
}
