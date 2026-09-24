import { revalidatePath, revalidateTag } from "next/cache";

export const LISTINGS_CACHE_TAG = "listings";
/** Keep home feed warm for speed; deletes expire the tag immediately. */
export const HOME_FEED_REVALIDATE_SECONDS = 90;
export const CATEGORY_COUNTS_REVALIDATE_SECONDS = 60;

/**
 * Expire listing-derived caches immediately (home, search counts, featured).
 * Prefer expire:0 over "max" so deleted/rejected ads never SWR-serve as active.
 */
export function bumpListingsCache() {
  try {
    revalidateTag(LISTINGS_CACHE_TAG, { expire: 0 });
    revalidatePath("/", "page");
    revalidatePath("/search", "page");
    revalidatePath("/featured", "page");
    revalidatePath("/categories", "layout");
  } catch {
    // Outside a Next.js request (scripts/tests): skip.
  }
}

/** After admin category / subcategory edits — refresh browse + publish wizard. */
export function bumpCategoriesCache() {
  try {
    revalidateTag(LISTINGS_CACHE_TAG, { expire: 0 });
    revalidatePath("/", "page");
    revalidatePath("/search", "page");
    revalidatePath("/categories", "layout");
    revalidatePath("/listings/new", "page");
    revalidatePath("/dashboard/listings", "layout");
  } catch {
    // Outside a Next.js request (scripts/tests): skip.
  }
}
