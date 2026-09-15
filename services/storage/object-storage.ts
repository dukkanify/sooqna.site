import { createHash } from "node:crypto";
import {
  getLocalUploadAbsolutePath,
  localObjectStorage,
} from "@/services/storage/local-provider";
import { tryCreateS3ObjectStorage } from "@/services/storage/s3-provider";
import {
  UPLOAD_ALLOWED_TYPES,
  UPLOAD_MAX_BYTES,
  defaultVisibilityFor,
  resolveMediaClass,
  type MediaClass,
  type ObjectStorageProvider,
  type StoredObject,
  type StorageVisibility,
  type UploadInput,
} from "@/services/storage/types";

export type { StoredObject, MediaClass, StorageVisibility, UploadInput };
export {
  UPLOAD_ALLOWED_TYPES,
  UPLOAD_MAX_BYTES,
  getLocalUploadAbsolutePath,
  resolveMediaClass,
  defaultVisibilityFor,
};

let cachedProvider: ObjectStorageProvider | null = null;

/**
 * Active object storage provider.
 * Prefers S3-compatible (AWS / R2 / MinIO) when credentials exist;
 * otherwise durable local fallback under the auth data directory.
 */
export function getObjectStorage(): ObjectStorageProvider {
  if (cachedProvider) return cachedProvider;
  cachedProvider = tryCreateS3ObjectStorage() ?? localObjectStorage;
  return cachedProvider;
}

/** Test helper — clear provider cache after env changes. */
export function resetObjectStorageCache(): void {
  cachedProvider = null;
}

/** @deprecated Prefer storeUploadedObject — kept for older call sites. */
export async function storeUploadedObject(input: {
  buffer: Buffer;
  contentType: string;
  folder?: string;
  mediaClass?: MediaClass;
  visibility?: StorageVisibility;
  ownerScope?: string;
}): Promise<StoredObject> {
  if (!UPLOAD_ALLOWED_TYPES.has(input.contentType)) {
    throw new Error("UNSUPPORTED_MEDIA_TYPE");
  }
  if (
    input.buffer.byteLength <= 0 ||
    input.buffer.byteLength > UPLOAD_MAX_BYTES
  ) {
    throw new Error("FILE_TOO_LARGE");
  }

  const mediaClass = input.mediaClass ?? resolveMediaClass(input.folder);
  const visibility = input.visibility ?? defaultVisibilityFor(mediaClass);
  const upload: UploadInput = {
    buffer: input.buffer,
    contentType: input.contentType,
    folder: input.folder ?? mediaClass,
    mediaClass,
    visibility,
    ownerScope: input.ownerScope,
  };

  return getObjectStorage().upload(upload);
}

export async function storeDataUrlObject(
  dataUrl: string,
  folder = "general",
): Promise<StoredObject> {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("INVALID_DATA_URL");
  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  return storeUploadedObject({ buffer, contentType, folder });
}

/** Back-compat alias used by older upload helpers. */
export const storeDataUrlObjectAlias = storeDataUrlObject;

export function mediaFingerprint(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 16);
}

export async function deleteStoredObject(key: string): Promise<boolean> {
  return getObjectStorage().delete(key);
}

export async function storedObjectExists(key: string): Promise<boolean> {
  return getObjectStorage().exists(key);
}

export async function getStoredObjectSignedUrl(
  key: string,
  expiresInSeconds = 300,
): Promise<string> {
  return getObjectStorage().getSignedUrl(key, expiresInSeconds);
}

export function getStoredObjectPublicUrl(key: string): string {
  return getObjectStorage().getPublicUrl(key);
}

export function isPrivateMediaKey(key: string): boolean {
  const root = (normalizeRoot(key) ?? "").split("/")[0];
  return root === "evidence" || root === "disputes" || root === "dispute";
}

function normalizeRoot(key: string): string | null {
  const normalized = key.replace(/^\/+/, "").replace(/\.\./g, "");
  return normalized || null;
}
