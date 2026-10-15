/**
 * Listing media durability helpers.
 * On Vercel without S3, `/api/media/...` lives on ephemeral disk and 404s after
 * cold starts — never treat those URLs as durable listing photos.
 * Inline `data:` / `blob:` URLs also must not ship as browse-card covers.
 */

export function isEphemeralListingMediaUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith("/api/media/") ||
    trimmed.includes("/api/media/")
  );
}

export function isInlineListingMediaUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const value = url.trim().toLowerCase();
  return value.startsWith("data:") || value.startsWith("blob:");
}

/** Remote https (or durable absolute) cover suitable for public cards + SSR. */
export function isRemoteDurableListingMediaUrl(
  url: string | undefined | null,
): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  if (isInlineListingMediaUrl(trimmed)) return false;
  if (isEphemeralListingMediaUrl(trimmed)) return false;
  return (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("/")
  );
}

export function durableListingImageUrl(
  url: string | undefined | null,
): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (isEphemeralListingMediaUrl(trimmed)) return undefined;
  return trimmed;
}

/** Collect image URLs from a listing row (gallery first, then cover). */
export function listingMediaUrls(listing: {
  imageUrl?: string;
  images?: string[];
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const url of [...(listing.images ?? []), listing.imageUrl ?? ""]) {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function listingHasRemoteDurableCover(listing: {
  imageUrl?: string;
  images?: string[];
}): boolean {
  return listingMediaUrls(listing).some(isRemoteDurableListingMediaUrl);
}

export function listingHasInlineMedia(listing: {
  imageUrl?: string;
  images?: string[];
}): boolean {
  return listingMediaUrls(listing).some(isInlineListingMediaUrl);
}

export function sanitizeListingMediaFields<
  T extends { imageUrl?: string; images?: string[] },
>(listing: T): T {
  const images = (listing.images ?? [])
    .map((url) => durableListingImageUrl(url))
    .filter((url): url is string => Boolean(url));
  const imageUrl =
    durableListingImageUrl(listing.imageUrl) ?? images[0] ?? undefined;

  return {
    ...listing,
    ...(imageUrl ? { imageUrl } : { imageUrl: undefined }),
    ...(images.length > 0 ? { images } : { images: undefined }),
  };
}
