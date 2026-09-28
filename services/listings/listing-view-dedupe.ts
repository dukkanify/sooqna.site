import { createHash } from "node:crypto";

const COOKIE_PREFIX = "sooqna_lv_";
const DEDUPE_SECONDS = 60 * 60 * 12; // 12 hours — covers refresh / back-nav

/** In-memory IP+listing guard (best-effort across a warm instance). */
const ipHits = new Map<string, number>();

export function listingViewCookieName(listingId: string): string {
  const digest = createHash("sha256")
    .update(listingId)
    .digest("hex")
    .slice(0, 16);
  return `${COOKIE_PREFIX}${digest}`;
}

export function listingViewCookieMaxAge(): number {
  return DEDUPE_SECONDS;
}

export function hasListingViewCookie(
  cookieHeader: string | null,
  listingId: string,
): boolean {
  if (!cookieHeader) return false;
  const name = listingViewCookieName(listingId);
  return cookieHeader.split(";").some((part) => {
    const [rawKey, rawValue] = part.trim().split("=");
    return rawKey === name && rawValue === "1";
  });
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "unknown";
}

/**
 * Returns true when this IP already counted this listing within the window.
 * Also records the hit when returning false so the next call is blocked.
 */
export function alreadyCountedForIp(
  ip: string,
  listingId: string,
  now = Date.now(),
): boolean {
  const key = `${ip}|${listingId}`;
  const previous = ipHits.get(key);
  if (previous != null && now - previous < DEDUPE_SECONDS * 1000) {
    return true;
  }
  ipHits.set(key, now);

  // Opportunistic cleanup to keep the map bounded.
  if (ipHits.size > 5_000) {
    const cutoff = now - DEDUPE_SECONDS * 1000;
    for (const [entryKey, at] of ipHits) {
      if (at < cutoff) ipHits.delete(entryKey);
    }
  }
  return false;
}

/** Looks like a non-browser automated client (curl, scripts, empty UA). */
export function looksLikeAutomatedClient(userAgent: string | null): boolean {
  const ua = userAgent?.trim() ?? "";
  if (!ua) return true;
  return /^(curl|wget|python-requests|python-urllib|go-http-client|java\/|scrapy|httpclient|libwww)/i.test(
    ua,
  );
}
