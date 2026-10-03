import type { Listing } from "@/types";
import { getAppUrl } from "@/shared/constants/site";

export function getListingPath(listing: Pick<Listing, "id" | "slug">): string {
  if (listing.slug?.trim()) {
    return `/listings/${listing.slug}`;
  }
  return listing.id.startsWith("local-")
    ? `/listings/local/${listing.id}`
    : `/listings/${listing.id}`;
}

/** Public listing URL from whatever ids we have (slug preferred). */
export function listingDetailsHref(input: {
  id?: string | null;
  slug?: string | null;
}): string | undefined {
  const id = String(input.id ?? "").trim();
  const slug = String(input.slug ?? "").trim();
  if (!id && !slug) return undefined;
  return getListingPath({ id: id || slug, slug });
}

/** Extract listing id/slug from a marketplace path such as `/listings/foo`. */
export function listingKeyFromHref(
  href: string | null | undefined,
): string | undefined {
  const path = String(href ?? "").trim();
  const match = path.match(/^\/listings\/(?:local\/)?([^/?#]+)/i);
  if (!match?.[1]) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Edit URL for a listing.
 * Synced catalog ads (including ids that still start with `local-`) must use
 * the server edit page — the `/listings/local/…/edit` route only reads
 * localStorage and 404s on another browser/device.
 */
export function getListingEditPath(
  listing: Pick<Listing, "id" | "slug">,
  options?: { synced?: boolean },
): string {
  const synced =
    options?.synced ??
    (Boolean(listing.slug?.trim()) || !listing.id.startsWith("local-"));
  if (synced) {
    const key = listing.slug?.trim() || listing.id;
    return `/listings/${key}/edit`;
  }
  return `/listings/local/${listing.id}/edit`;
}

export function getListingCanonicalUrl(listing: Listing): string {
  return `${getAppUrl()}${getListingPath(listing)}`;
}

export function getCheckoutPath(listing: Listing): string {
  const listingRef = listing.slug?.trim() || listing.id;
  return `/checkout?listingId=${encodeURIComponent(listingRef)}`;
}
