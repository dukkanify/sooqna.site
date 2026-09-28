import { NextResponse } from "next/server";
import { getValidSessionUser } from "@/services/auth/require-session";
import { getListingById } from "@/services/listings/listing-store";
import {
  getListingViewCount,
  incrementListingView,
} from "@/services/listings/listing-views-store";
import { isPublicListingStatus } from "@/shared/constants/listingStatuses";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    listingId?: string;
  };
  const listingId = String(body.listingId ?? "").trim();
  if (!listingId) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const listing = await getListingById(listingId).catch(() => undefined);
  if (!listing || !isPublicListingStatus(listing.status)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // Owners viewing their own ad should not inflate the counter.
  const session = await getValidSessionUser();
  if (session && session.id === listing.seller.id) {
    const views = await getListingViewCount(listing.id);
    return NextResponse.json({
      ok: true,
      counted: false,
      views,
    });
  }

  const views = await incrementListingView(listing.id);
  return NextResponse.json({ ok: true, counted: true, views });
}
