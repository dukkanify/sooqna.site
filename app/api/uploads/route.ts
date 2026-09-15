import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  storeUploadedObject,
  UPLOAD_MAX_BYTES,
} from "@/services/storage/object-storage";

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeUploadedObject({
      buffer,
      contentType: file.type || "application/octet-stream",
      folder,
      ownerScope: user.id,
    });

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
