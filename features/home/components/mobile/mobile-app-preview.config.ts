import type { Listing } from "@/types";
import { getListingImageUrl } from "@/features/listings/components/listing-card.utils";

/**
 * Preferred live-catalog slugs for the app-download phone mockup.
 * Match prefix/contains so indexed slugs like `mercedes-amg-g63-2024-003` still hit.
 */
export const APP_PREVIEW_LISTING_SLUGS = [
  "mercedes-amg-g63-2024",
  "playstation-5",
  "iphone-16-pro-max",
  "toyota-land-cruiser",
  "samsung-galaxy-s25",
  "bmw-x7",
  "furnished-2br",
] as const;

export function getAppPreviewImageUrl(listing: Listing): string | undefined {
  return getListingImageUrl(listing);
}

function hasCover(listing: Listing): boolean {
  return Boolean(getListingImageUrl(listing));
}

function listingMatchesPreviewSlug(listing: Listing, needle: string): boolean {
  const slug = listing.slug;
  return slug === needle || slug.startsWith(`${needle}-`) || slug.includes(needle);
}

/** Ranked catalog cards for the phone screen — real covers only, unique photos. */
export function resolveAppPreviewListings(listings: Listing[]): Listing[] {
  const seenIds = new Set<string>();
  const seenCovers = new Set<string>();
  const picked: Listing[] = [];

  const coverKey = (url: string | undefined) => {
    if (!url?.trim()) return "";
    try {
      const parsed = new URL(url.trim());
      return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
    } catch {
      return url.trim().split("?")[0]?.toLowerCase() ?? "";
    }
  };

  const take = (listing?: Listing) => {
    if (!listing || seenIds.has(listing.id) || !hasCover(listing)) return;
    const cover = getListingImageUrl(listing);
    const key = coverKey(cover);
    if (key && seenCovers.has(key)) return;
    seenIds.add(listing.id);
    if (key) seenCovers.add(key);
    picked.push(listing);
  };

  for (const needle of APP_PREVIEW_LISTING_SLUGS) {
    take(listings.find((listing) => listingMatchesPreviewSlug(listing, needle)));
  }
  for (const listing of listings) {
    if (picked.length >= 6) break;
    take(listing);
  }
  return picked;
}
