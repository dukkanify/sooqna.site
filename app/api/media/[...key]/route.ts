import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import { getAdminDisputes } from "@/services/admin/dispute-store";
import { getOrderById } from "@/services/payments/order-store";
import {
  getLocalUploadAbsolutePath,
  getObjectStorage,
  isPrivateMediaKey,
} from "@/services/storage/object-storage";

type RouteParams = { params: Promise<{ key: string[] }> };

/**
 * Serve uploads.
 * Public listing/general media: readable.
 * Private evidence/dispute media: buyer, seller, or admin only.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { key: parts } = await params;
  const key = (parts ?? []).join("/");
  if (!key) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (isPrivateMediaKey(key)) {
    const user = await requireSessionUser();
    if (!isSessionUser(user)) return user;

    if (user.role !== "admin") {
      const allowed = await canAccessPrivateMedia(user.id, key);
      if (!allowed) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
    }
  }

  const storage = getObjectStorage();

  if (storage.getObjectBuffer) {
    const local = await storage.getObjectBuffer(key);
    if (local) {
      return new NextResponse(new Uint8Array(local.buffer), {
        status: 200,
        headers: {
          "Content-Type": local.contentType,
          "Cache-Control": isPrivateMediaKey(key)
            ? "private, no-store"
            : "public, max-age=31536000, immutable",
        },
      });
    }
  }

  if (storage.name === "s3" && isPrivateMediaKey(key)) {
    try {
      const signed = await storage.getSignedUrl(key, 300);
      return NextResponse.redirect(signed, 302);
    } catch {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
  }

  if (storage.name === "s3") {
    const exists = await storage.exists(key);
    if (!exists) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.redirect(storage.getPublicUrl(key), 302);
  }

  // Compat: ensure absolute path still resolves for local provider edge cases.
  if (!getLocalUploadAbsolutePath(key)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
}

async function canAccessPrivateMedia(
  userId: string,
  key: string,
): Promise<boolean> {
  const segments = key.split("/");
  if (segments.length >= 2 && segments[1] === userId) return true;

  const orderId = segments.find((part) => part.startsWith("ord-"));
  if (orderId) {
    const order = await getOrderById(orderId);
    if (order && (order.buyerId === userId || order.sellerId === userId)) {
      return true;
    }
  }

  try {
    const disputes = await getAdminDisputes();
    for (const dispute of disputes) {
      const urls = dispute.evidenceUrls ?? [];
      if (!urls.some((url) => url.includes(key))) continue;
      const order = await getOrderById(dispute.orderId);
      if (order && (order.buyerId === userId || order.sellerId === userId)) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}
