import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  defaultVisibilityFor,
  extensionFor,
  normalizeObjectKey,
  resolveMediaClass,
  type ObjectStorageProvider,
  type StoredObject,
  type UploadInput,
} from "@/services/storage/types";

export type S3EnvConfig = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicBaseUrl?: string;
  forcePathStyle: boolean;
};

export function readS3EnvConfig(): S3EnvConfig | null {
  const bucket =
    process.env.S3_BUCKET?.trim() || process.env.AWS_S3_BUCKET?.trim();
  const region =
    process.env.S3_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    "me-central-1";
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const endpoint =
    process.env.S3_ENDPOINT?.trim() ||
    process.env.AWS_ENDPOINT_URL_S3?.trim() ||
    undefined;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.trim() || undefined;
  const forcePathStyle =
    process.env.S3_FORCE_PATH_STYLE === "true" ||
    Boolean(endpoint && !endpoint.includes("amazonaws.com"));

  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    endpoint,
    publicBaseUrl,
    forcePathStyle,
  };
}

function createClient(config: S3EnvConfig): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function publicUrlFor(config: S3EnvConfig, key: string): string {
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }
  if (config.endpoint) {
    const base = config.endpoint.replace(/\/$/, "");
    return config.forcePathStyle
      ? `${base}/${config.bucket}/${key}`
      : `${base}/${key}`;
  }
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

export function createS3ObjectStorage(
  config: S3EnvConfig,
): ObjectStorageProvider {
  const client = createClient(config);

  return {
    name: "s3",

    async upload(input: UploadInput): Promise<StoredObject> {
      const mediaClass = input.mediaClass ?? resolveMediaClass(input.folder);
      const visibility = input.visibility ?? defaultVisibilityFor(mediaClass);
      const folder = input.folder ?? mediaClass;
      const scope = input.ownerScope ? `/${input.ownerScope}` : "";
      const key = `${folder}${scope}/${randomUUID()}.${extensionFor(input.contentType)}`;

      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: input.buffer,
          ContentType: input.contentType,
          ContentLength: input.buffer.byteLength,
        }),
      );

      return {
        key,
        url:
          visibility === "public"
            ? publicUrlFor(config, key)
            : `/api/media/${key}`,
        contentType: input.contentType,
        byteSize: input.buffer.byteLength,
        provider: "s3",
        visibility,
        mediaClass,
      };
    },

    async delete(key: string): Promise<boolean> {
      const normalized = normalizeObjectKey(key);
      if (!normalized) return false;
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: config.bucket,
            Key: normalized,
          }),
        );
        return true;
      } catch {
        return false;
      }
    },

    async exists(key: string): Promise<boolean> {
      const normalized = normalizeObjectKey(key);
      if (!normalized) return false;
      try {
        await client.send(
          new HeadObjectCommand({
            Bucket: config.bucket,
            Key: normalized,
          }),
        );
        return true;
      } catch {
        return false;
      }
    },

    getPublicUrl(key: string): string {
      const normalized = normalizeObjectKey(key) ?? key;
      return publicUrlFor(config, normalized);
    },

    async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string> {
      const normalized = normalizeObjectKey(key);
      if (!normalized) throw new Error("INVALID_OBJECT_KEY");
      const command = new GetObjectCommand({
        Bucket: config.bucket,
        Key: normalized,
      });
      return awsGetSignedUrl(client, command, {
        expiresIn: Math.min(Math.max(expiresInSeconds, 30), 3600),
      });
    },
  };
}

export function tryCreateS3ObjectStorage(): ObjectStorageProvider | null {
  const config = readS3EnvConfig();
  if (!config) return null;
  return createS3ObjectStorage(config);
}
