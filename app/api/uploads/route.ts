import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import { isServerlessRuntime } from "@/services/db/postgres";
import {
  storeUploadedObject,
  UPLOAD_ALLOWED_TYPES,
  UPLOAD_MAX_BYTES,
} from "@/services/storage/object-storage";

function normalizeContentType(file: File): string {
  const raw = (file.type || "").trim().toLowerCase();
  if (raw === "image/jpg") return "image/jpeg";
  if (UPLOAD_ALLOWED_TYPES.has(raw)) return raw;

  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".webm")) return "video/webm";
  if (name.endsWith(".pdf")) return "application/pdf";
  return raw || "application/octet-stream";
}

/**
 * Authenticated multipart upload → durable object URL (local media API or S3).
 * Form fields: file (required), folder (optional: evidence | listings | disputes).
 */
export async function POST(request: Request) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    }

    const folderRaw = String(form.get("folder") ?? "general");
    const folder = ["evidence", "listings", "disputes", "general"].includes(
      folderRaw,
    )
      ? folderRaw
      : "general";

    if (file.size > UPLOAD_MAX_BYTES) {
      return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
    }

    const contentType = normalizeContentType(file);
    if (!UPLOAD_ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "UNSUPPORTED_MEDIA_TYPE" },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeUploadedObject({
      buffer,
      contentType,
      folder,
      ownerScope: user.id,
    });

    // Serverless local disk is ephemeral — ask the client to persist inline.
    if (
      folder === "listings" &&
      stored.provider === "local" &&
      isServerlessRuntime()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "EPHEMERAL_STORAGE",
          preferClientPersist: true,
          provider: stored.provider,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      url: stored.url,
      key: stored.key,
      contentType: stored.contentType,
      byteSize: stored.byteSize,
      provider: stored.provider,
      visibility: stored.visibility,
      mediaClass: stored.mediaClass,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPLOAD_FAILED";
    const status =
      message === "UNSUPPORTED_MEDIA_TYPE"
        ? 415
        : message === "FILE_TOO_LARGE"
          ? 413
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
