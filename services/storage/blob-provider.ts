import { randomUUID } from "node:crypto";
import { del, get, head, put } from "@vercel/blob";
import {
  defaultVisibilityFor,
  extensionFor,
  normalizeObjectKey,
  resolveMediaClass,
  type ObjectStorageProvider,
  type StoredObject,
  type UploadInput,
} from "@/services/storage/types";

export function readBlobEnvConfig(): { token: string } | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;
  return { token };
}

function accessFor(visibility: "public" | "private"): "public" | "private" {
  return visibility;
}

function inferVisibilityFromKey(key: string): "public" | "private" {
  const root = key.split("/")[0];
  if (root === "evidence" || root === "disputes" || root === "dispute") {
    return "private";
  }
  return "public";
}

async function streamToBuffer(
  stream: ReadableStream<Uint8Array>,
): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

export function createBlobObjectStorage(token: string): ObjectStorageProvider {
  const tokenOpts = { token };

  return {
    name: "blob",

    async upload(input: UploadInput): Promise<StoredObject> {
      const mediaClass = input.mediaClass ?? resolveMediaClass(input.folder);
      const visibility = input.visibility ?? defaultVisibilityFor(mediaClass);
      const folder = input.folder ?? mediaClass;
      const scope = input.ownerScope ? `/${input.ownerScope}` : "";
      const key = `${folder}${scope}/${randomUUID()}.${extensionFor(input.contentType)}`;
      const access = accessFor(visibility);

      const result = await put(key, input.buffer, {
        ...tokenOpts,
        access,
        contentType: input.contentType,
        addRandomSuffix: false,
      });

      return {
        key: result.pathname || key,
        url: visibility === "public" ? result.url : `/api/media/${key}`,
        contentType: input.contentType,
        byteSize: input.buffer.byteLength,
        provider: "blob",
        visibility,
        mediaClass,
      };
    },

    async delete(key: string): Promise<boolean> {
      const normalized = normalizeObjectKey(key);
      if (!normalized) return false;
      try {
        await del(normalized, tokenOpts);
        return true;
      } catch {
        return false;
      }
    },

    async exists(key: string): Promise<boolean> {
      const normalized = normalizeObjectKey(key);
      if (!normalized) return false;
      try {
        await head(normalized, tokenOpts);
        return true;
      } catch {
        return false;
      }
    },

    getPublicUrl(key: string): string {
      // Blob CDN host is store-specific; serve via media proxy when reconstructing.
      return `/api/media/${normalizeObjectKey(key) ?? key}`;
    },

    async getSignedUrl(key: string, _expiresInSeconds = 300): Promise<string> {
      const normalized = normalizeObjectKey(key);
      if (!normalized) throw new Error("INVALID_OBJECT_KEY");
      const meta = await head(normalized, tokenOpts);
      return meta.url;
    },

    async getObjectBuffer(key: string) {
      const normalized = normalizeObjectKey(key);
      if (!normalized) return null;
      const visibility = inferVisibilityFromKey(normalized);
      try {
        const result = await get(normalized, {
          ...tokenOpts,
          access: accessFor(visibility),
        });
        if (!result || result.statusCode !== 200 || !result.stream) {
          return null;
        }
        const buffer = await streamToBuffer(result.stream);
        return {
          buffer,
          contentType: result.blob.contentType || "application/octet-stream",
        };
      } catch {
        // Retry opposite access in case visibility inference is wrong.
        try {
          const alt = visibility === "public" ? "private" : "public";
          const result = await get(normalized, {
            ...tokenOpts,
            access: alt,
          });
          if (!result || result.statusCode !== 200 || !result.stream) {
            return null;
          }
          const buffer = await streamToBuffer(result.stream);
          return {
            buffer,
            contentType: result.blob.contentType || "application/octet-stream",
          };
        } catch {
          return null;
        }
      }
    },
  };
}

export function tryCreateBlobObjectStorage(): ObjectStorageProvider | null {
  const config = readBlobEnvConfig();
  if (!config) return null;
  return createBlobObjectStorage(config.token);
}
