import type { Listing } from "@/types";
import { galleryForListingProduct } from "@/shared/constants/listing-product-media";
import { listingHasRemoteDurableCover } from "@/shared/listings/durable-media";

/**
 * Category/product-matched temporary cover when a listing has no durable photo.
 * Used for browse cards + one-time persist backfill — not a substitute for real
 * seller uploads when those already exist.
 */
export function temporaryCoverUrlsForListing(
  listing: Pick<Listing, "id" | "categoryId" | "title" | "titleEnglish">,
  count = 1,
): string[] {
  return galleryForListingProduct({
    categoryId: listing.categoryId,
    count: Math.max(1, count),
    seed: listing.id || listing.title || listing.categoryId,
    title: listing.title,
    titleEnglish: listing.titleEnglish,
    width: 1200,
  });
}

export function temporaryCoverUrlForListing(
  listing: Pick<Listing, "id" | "categoryId" | "title" | "titleEnglish">,
): string | undefined {
  return temporaryCoverUrlsForListing(listing, 1)[0];
}

/** Prefer real durable media; otherwise a temporary category-matched cover. */
export function listingCoverUrlOrTemporary(
  listing: Pick<
    Listing,
    "id" | "categoryId" | "title" | "titleEnglish" | "imageUrl" | "images"
  >,
): string | undefined {
  if (listingHasRemoteDurableCover(listing)) {
    for (const url of [...(listing.images ?? []), listing.imageUrl ?? ""]) {
      const trimmed = url?.trim();
      if (
        trimmed &&
        !trimmed.toLowerCase().startsWith("data:") &&
        !trimmed.toLowerCase().startsWith("blob:")
      ) {
        return trimmed;
      }
    }
  }
  return temporaryCoverUrlForListing(listing);
}
