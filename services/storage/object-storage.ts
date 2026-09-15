import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDurableAuthDir } from "@/services/auth/user-persistence";

export type StoredObject = {
  key: string;
  url: string;
  contentType: string;
  byteSize: number;
  provider: "local" | "s3";
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

function extensionFor(contentType: string): string {
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

function uploadsRoot(): string {
  return path.join(getDurableAuthDir(), "uploads");
}

async function putLocalObject(input: {
  buffer: Buffer;
  contentType: string;
  folder: string;
}): Promise<StoredObject> {
  const key = `${input.folder}/${randomUUID()}.${extensionFor(input.contentType)}`;
  const absolute = path.join(uploadsRoot(), key);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, input.buffer);
  return {
    key,
    url: `/api/media/${key}`,
    contentType: input.contentType,
    byteSize: input.buffer.byteLength,
    provider: "local",
  };
}

/**
 * Optional S3-compatible PUT when bucket + keys are configured.
 * Without credentials, falls back to durable local storage + `/api/media`.
 */
async function putS3Object(input: {
  buffer: Buffer;
  contentType: string;
  folder: string;
}): Promise<StoredObject | null> {
  const bucket =
    process.env.S3_BUCKET?.trim() || process.env.AWS_S3_BUCKET?.trim();
  const region =
    process.env.S3_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    "me-central-1";
  const accessKey =
    process.env.S3_ACCESS_KEY_ID?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretKey =
    process.env.S3_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const publicBase =
    process.env.S3_PUBLIC_BASE_URL?.trim() ||
    (bucket ? `https://${bucket}.s3.${region}.amazonaws.com` : "");

  if (!bucket || !accessKey || !secretKey || !publicBase) {
    return null;
  }

  const key = `${input.folder}/${randomUUID()}.${extensionFor(input.contentType)}`;
  const uploadUrl = process.env.S3_UPLOAD_URL_TEMPLATE?.replace("{key}", key);
  if (!uploadUrl) {
    return null;
  }

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.contentType,
      "Content-Length": String(input.buffer.byteLength),
    },
    body: new Uint8Array(input.buffer),
  });
  if (!response.ok) return null;

  return {
    key,
    url: `${publicBase.replace(/\/$/, "")}/${key}`,
    contentType: input.contentType,
    byteSize: input.buffer.byteLength,
    provider: "s3",
  };
}

export async function storeUploadedObject(input: {
  buffer: Buffer;
  contentType: string;
  folder?: string;
}): Promise<StoredObject> {
  if (!UPLOAD_ALLOWED_TYPES.has(input.contentType)) {
    throw new Error("UNSUPPORTED_MEDIA_TYPE");
  }
  if (input.buffer.byteLength <= 0 || input.buffer.byteLength > UPLOAD_MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const folder = input.folder ?? "general";
  const s3 = await putS3Object({ ...input, folder });
  if (s3) return s3;
  return putLocalObject({ ...input, folder });
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

export function mediaFingerprint(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 16);
}

export function getLocalUploadAbsolutePath(key: string): string | null {
  const normalized = key.replace(/^\/+/, "").replace(/\.\./g, "");
  if (!normalized || normalized.includes("\0")) return null;
  const absolute = path.join(uploadsRoot(), normalized);
  if (!absolute.startsWith(uploadsRoot())) return null;
  return absolute;
}
