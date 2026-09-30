import type { Listing } from "@/types";

const SHOWCASE_SOURCE = "SOOQNA_SHOWCASE";
const SHOWCASE_SELLER_ID = "seller-sooqna-showcase";
const LIVE_MARKETPLACE_SOURCE = "SOOQNA_LIVE_MARKETPLACE";

function addDaysIso(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function parseTime(iso?: string): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function isShowcaseRef(listing: Listing): boolean {
  if (listing.source === SHOWCASE_SOURCE || listing.isDemo === true) return true;
  if (listing.seller?.id === SHOWCASE_SELLER_ID) return true;
  return Boolean(listing.id?.startsWith("showcase-"));
}

function isLiveCatalogRef(listing: Listing): boolean {
  if (listing.source === LIVE_MARKETPLACE_SOURCE) return true;
  return Boolean(listing.id?.startsWith("live-mkt-"));
}

function hasOpenFeaturedWindow(listing: Listing, nowMs: number): boolean {
  if (!listing.isFeatured) return false;
  const featuredMs = parseTime(listing.featuredUntil);
  return featuredMs !== null && featuredMs > nowMs;
}

/**
 * Mark active listings as expired when their window has ended.
 * - Showcase + live catalog seeds are never auto-expired.
 * - Prefer explicit `expiresAt` over postedAt + days.
 * - Active featured packages are not expired mid-window.
 * Mutates the given array in place and returns how many were expired.
 */
export function expireStaleListings(listings: Listing[], days: number): number {
  const nowMs = Date.now();
  const cutoffMs = nowMs - Math.max(1, days) * 24 * 60 * 60 * 1000;
  let changed = 0;

  for (const listing of listings) {
    if (listing.status !== "active") continue;
    if (isShowcaseRef(listing)) continue;
    if (isLiveCatalogRef(listing)) continue;
    if (hasOpenFeaturedWindow(listing, nowMs)) continue;

    const expiresMs = parseTime(listing.expiresAt);
    if (expiresMs !== null) {
      if (expiresMs > nowMs) continue;
      listing.status = "expired";
      changed += 1;
      continue;
    }

    const postedAt = listing.postedAt;
    if (!postedAt) continue;
    const postedMs = parseTime(postedAt);
    if (postedMs === null || postedMs > cutoffMs) continue;

    listing.status = "expired";
    listing.expiresAt = addDaysIso(postedAt, days);
    changed += 1;
  }

  return changed;
}

/**
 * Undo premature expiry (e.g. live-catalog rows marked expired by the old
 * postedAt+30d rule while their seed `expiresAt` / featured window is still open).
 * Mutates in place; returns how many were restored to `active`.
 */
export function restorePrematurelyExpiredListings(listings: Listing[]): number {
  const nowMs = Date.now();
  let changed = 0;

  for (const listing of listings) {
    if (listing.status !== "expired") continue;

    if (isLiveCatalogRef(listing)) {
      const expiresMs = parseTime(listing.expiresAt);
      // Seed catalog is evergreen until an explicit expiresAt has passed.
      if (expiresMs === null || expiresMs > nowMs) {
        listing.status = "active";
        changed += 1;
      }
      continue;
    }

    if (hasOpenFeaturedWindow(listing, nowMs)) {
      listing.status = "active";
      changed += 1;
      continue;
    }

    const expiresMs = parseTime(listing.expiresAt);
    if (expiresMs !== null && expiresMs > nowMs) {
      listing.status = "active";
      changed += 1;
    }
  }

  return changed;
}

export function computeExpiresAt(postedAt: string, days: number): string {
  return addDaysIso(postedAt, Math.max(1, days));
}
