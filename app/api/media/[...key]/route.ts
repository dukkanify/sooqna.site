import { readFile, stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getLocalUploadAbsolutePath } from "@/services/storage/object-storage";

type RouteParams = { params: Promise<{ key: string[] }> };

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

/**
 * Serve locally stored uploads from the durable uploads directory.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { key: parts } = await params;
  const key = (parts ?? []).join("/");
  const absolute = getLocalUploadAbsolutePath(key);
  if (!absolute) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    await stat(absolute);
    const data = await readFile(absolute);
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}
