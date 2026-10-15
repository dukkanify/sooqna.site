import type { Listing } from "@/types";
import {
  listingHasInlineMedia,
  listingHasRemoteDurableCover,
} from "@/shared/listings/durable-media";
import { temporaryCoverUrlsForListing } from "@/shared/listings/temporary-listing-cover";
import {
  hasCloudObjectStorage,
  materializeInlineListingImages,
} from "@/services/listings/listing-publish-guards";
import { upsertListingRow } from "@/services/listings/listing-persistence";
import { bumpListingsCache } from "@/services/listings/listings-cache";

/** Cap Blob uploads / temp backfills per request so home/search stay responsive. */
const REPAIR_BUDGET_PER_PASS = 24;

function withTemporaryCover(listing: Listing): Listing {
  const urls = temporaryCoverUrlsForListing(listing, 3);
  if (urls.length === 0) return listing;
  return {
    ...listing,
    images: urls,
    imageUrl: urls[0],
  };
}

/**
 * Promote inline `data:` seller photos to Blob/S3 and persist the durable URLs.
 * When the listing still has no cover (or never had one), attach a temporary
 * category-matched gallery and persist so browse cards stop showing «لا توجد صورة».
 */
export async function persistRepairedInlineListingMedia(
  listing: Listing,
): Promise<Listing> {
  let next = listing;

  if (hasCloudObjectStorage() && listingHasInlineMedia(next)) {
    const repaired = await materializeInlineListingImages(next);
    if (listingHasRemoteDurableCover(repaired)) {
      next = {
        ...next,
        images: repaired.images,
        imageUrl: repaired.imageUrl,
      };
    }
  }

  if (!listingHasRemoteDurableCover(next) && !listingHasInlineMedia(next)) {
    next = withTemporaryCover(next);
  }

  if (
    next.imageUrl === listing.imageUrl &&
    JSON.stringify(next.images ?? []) === JSON.stringify(listing.images ?? [])
  ) {
    return listing;
  }

  try {
    await upsertListingRow(next);
    bumpListingsCache();
  } catch {
    // Still return repaired/temporary URLs for this response even if persist failed.
  }
  return next;
}

/**
 * Repair a batch of public catalog rows (home rails, search, category grids).
 * Returns listings with remote covers when Blob/S3 accepted the upload, or a
 * temporary category cover when the ad had no photo at all.
 */
export async function repairInlineMediaForPublicRows(
  listings: Listing[],
  budget = REPAIR_BUDGET_PER_PASS,
): Promise<Listing[]> {
  if (budget <= 0) return listings;

  let remaining = budget;
  const out: Listing[] = [];
  for (const listing of listings) {
    const needsWork =
      listingHasInlineMedia(listing) || !listingHasRemoteDurableCover(listing);
    if (remaining > 0 && needsWork) {
      remaining -= 1;
      out.push(await persistRepairedInlineListingMedia(listing));
      continue;
    }
    out.push(listing);
  }
  return out;
}
