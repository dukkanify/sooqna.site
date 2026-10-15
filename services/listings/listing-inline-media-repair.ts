import type { Listing } from "@/types";
import {
  listingHasInlineMedia,
  listingHasRemoteDurableCover,
} from "@/shared/listings/durable-media";
import {
  hasCloudObjectStorage,
  materializeInlineListingImages,
} from "@/services/listings/listing-publish-guards";
import { upsertListingRow } from "@/services/listings/listing-persistence";
import { bumpListingsCache } from "@/services/listings/listings-cache";

/** Cap Blob uploads per request so home/search stay responsive. */
const REPAIR_BUDGET_PER_PASS = 24;

/**
 * Promote inline `data:` seller photos to Blob/S3 and persist the durable URLs.
 * Does NOT invent Unsplash/stock into the database — empty ads stay empty in
 * storage; browse/detail UI may show a temporary cover for display only.
 */
export async function persistRepairedInlineListingMedia(
  listing: Listing,
): Promise<Listing> {
  if (!hasCloudObjectStorage() || !listingHasInlineMedia(listing)) {
    return listing;
  }

  const repaired = await materializeInlineListingImages(listing);
  if (!listingHasRemoteDurableCover(repaired)) {
    return listing;
  }

  const next: Listing = {
    ...listing,
    images: repaired.images,
    imageUrl: repaired.imageUrl,
  };

  try {
    await upsertListingRow(next);
    bumpListingsCache();
  } catch {
    // Still return durable URLs for this response even if persist failed.
  }
  return next;
}

/**
 * Repair a batch of public catalog rows (home rails, search, category grids).
 * Returns listings with remote covers when Blob/S3 accepted the upload.
 */
export async function repairInlineMediaForPublicRows(
  listings: Listing[],
  budget = REPAIR_BUDGET_PER_PASS,
): Promise<Listing[]> {
  if (!hasCloudObjectStorage() || budget <= 0) return listings;

  let remaining = budget;
  const out: Listing[] = [];
  for (const listing of listings) {
    if (remaining > 0 && listingHasInlineMedia(listing)) {
      remaining -= 1;
      out.push(await persistRepairedInlineListingMedia(listing));
      continue;
    }
    out.push(listing);
  }
  return out;
}
