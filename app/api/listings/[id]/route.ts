import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import { deleteListingById, getListingById } from "@/services/listings/listing-store";
import { bumpListingsCache } from "@/services/listings/listings-cache";

type RouteParams = { params: Promise<{ id: string }> };

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
