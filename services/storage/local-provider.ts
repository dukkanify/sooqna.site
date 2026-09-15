import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDurableAuthDir } from "@/services/auth/user-persistence";
import {
  defaultVisibilityFor,
  extensionFor,
  normalizeObjectKey,
  resolveMediaClass,
  type ObjectStorageProvider,
  type StoredObject,
  type UploadInput,
} from "@/services/storage/types";

function uploadsRoot(): string {
  return path.join(getDurableAuthDir(), "uploads");
}

function absolutePathFor(key: string): string | null {
  const normalized = normalizeObjectKey(key);
  if (!normalized) return null;
  const absolute = path.join(uploadsRoot(), normalized);
  if (!absolute.startsWith(uploadsRoot())) return null;
  return absolute;
}

export function getLocalUploadAbsolutePath(key: string): string | null {
  return absolutePathFor(key);
}

export const localObjectStorage: ObjectStorageProvider = {
  name: "local",

  async upload(input: UploadInput): Promise<StoredObject> {
    const mediaClass = input.mediaClass ?? resolveMediaClass(input.folder);
    const visibility = input.visibility ?? defaultVisibilityFor(mediaClass);
    const folder = input.folder ?? mediaClass;
    const scope = input.ownerScope ? `/${input.ownerScope}` : "";
    const key = `${folder}${scope}/${randomUUID()}.${extensionFor(input.contentType)}`;
    const absolute = absolutePathFor(key);
    if (!absolute) throw new Error("INVALID_OBJECT_KEY");
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, input.buffer);
    return {
      key,
      url: `/api/media/${key}`,
      contentType: input.contentType,
      byteSize: input.buffer.byteLength,
      provider: "local",
      visibility,
      mediaClass,
    };
  },

  async delete(key: string): Promise<boolean> {
    const absolute = absolutePathFor(key);
    if (!absolute) return false;
    try {
      await unlink(absolute);
      return true;
    } catch {
      return false;
    }
  },

  async exists(key: string): Promise<boolean> {
    const absolute = absolutePathFor(key);
    if (!absolute) return false;
    try {
      await stat(absolute);
      return true;
    } catch {
      return false;
    }
  },

  getPublicUrl(key: string): string {
    return `/api/media/${normalizeObjectKey(key) ?? key}`;
  },

  async getSignedUrl(key: string): Promise<string> {
    return this.getPublicUrl(key);
  },

  async getObjectBuffer(key: string) {
    const absolute = absolutePathFor(key);
    if (!absolute) return null;
    try {
      const buffer = await readFile(absolute);
      const ext = key.split(".").pop()?.toLowerCase() ?? "";
      const contentType =
        (
          {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
            gif: "image/gif",
            mp4: "video/mp4",
            webm: "video/webm",
            pdf: "application/pdf",
          } as Record<string, string>
        )[ext] ?? "application/octet-stream";
      return { buffer, contentType };
    } catch {
      return null;
    }
  },
};
