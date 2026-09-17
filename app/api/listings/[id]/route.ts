import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  deleteListingById,
  getListingById,
  patchListingRecord,
} from "@/services/listings/listing-store";
import { bumpListingsCache } from "@/services/listings/listings-cache";
import { SELLER_MARKETPLACE_STATUSES } from "@/shared/constants/listingStatuses";

type RouteParams = { params: Promise<{ id: string }> };

const statusSchema = z.object({
  status: z.enum(["active", "reserved", "sold", "expired"]),
});

/** Owner updates marketplace lifecycle: Available / Reserved / Sold / Expired. */
export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) {
    return NextResponse.json({ error: "LISTING_NOT_FOUND" }, { status: 404 });
  }
  if (listing.seller.id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }
  if (
    !SELLER_MARKETPLACE_STATUSES.includes(parsed.data.status) &&
    user.role !== "admin"
  ) {
    return NextResponse.json({ error: "INVALID_STATUS" }, { status: 400 });
  }

  const updated = await patchListingRecord(id, { status: parsed.data.status });
  if (!updated) {
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }
  return NextResponse.json({ listing: updated });
}

/** Owner delete — removes the listing from the public catalog immediately. */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) {
    // Already gone — refresh feeds so stale cards drop without tombstoning unknown ids.
    bumpListingsCache();
    return NextResponse.json({ ok: true, deleted: false });
  }
  if (listing.seller.id !== user.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
  }

  const deleted = await deleteListingById(id, user.id);
  if (!deleted) {
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: true });
}
