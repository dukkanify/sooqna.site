import { NextResponse } from "next/server";
import { getValidSessionUser } from "@/services/auth/require-session";
import { getListingById } from "@/services/listings/listing-store";
import {
  alreadyCountedForIp,
  clientIpFromRequest,
  hasListingViewCookie,
  listingViewCookieMaxAge,
  listingViewCookieName,
  looksLikeAutomatedClient,
} from "@/services/listings/listing-view-dedupe";
import {
  getListingViewCount,
  incrementListingView,
} from "@/services/listings/listing-views-store";
import { isPublicListingStatus } from "@/shared/constants/listingStatuses";

function jsonWithOptionalCookie(
  body: Record<string, unknown>,
  listingId: string,
  setCookie: boolean,
) {
  const response = NextResponse.json(body);
  if (setCookie) {
    response.cookies.set({
      name: listingViewCookieName(listingId),
      value: "1",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: listingViewCookieMaxAge(),
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

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
      reason: "owner",
      views,
    });
  }

  const cookieHeader = request.headers.get("cookie");
  if (hasListingViewCookie(cookieHeader, listing.id)) {
    const views = await getListingViewCount(listing.id);
    return NextResponse.json({
      ok: true,
      counted: false,
      reason: "cookie",
      views,
    });
  }

  const ip = clientIpFromRequest(request);
  const userAgent = request.headers.get("user-agent");

  // Automated clients without a prior cookie: do not count (anti-inflation).
  if (looksLikeAutomatedClient(userAgent)) {
    const views = await getListingViewCount(listing.id);
    return jsonWithOptionalCookie(
      { ok: true, counted: false, reason: "automated", views },
      listing.id,
      false,
    );
  }

  if (alreadyCountedForIp(ip, listing.id)) {
    const views = await getListingViewCount(listing.id);
    return jsonWithOptionalCookie(
      { ok: true, counted: false, reason: "ip", views },
      listing.id,
      true,
    );
  }

  const views = await incrementListingView(listing.id);
  return jsonWithOptionalCookie(
    { ok: true, counted: true, views },
    listing.id,
    true,
  );
}
