/**
 * Listing media durability helpers.
 * On Vercel without S3, `/api/media/...` lives on ephemeral disk and 404s after
 * cold starts — never treat those URLs as durable listing photos.
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

export function durableListingImageUrl(
  url: string | undefined | null,
): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (isEphemeralListingMediaUrl(trimmed)) return undefined;
  return trimmed;
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
