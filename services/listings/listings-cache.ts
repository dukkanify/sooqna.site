import { revalidateTag } from "next/cache";

export const LISTINGS_CACHE_TAG = "listings";
export const HOME_FEED_REVALIDATE_SECONDS = 30;
export const CATEGORY_COUNTS_REVALIDATE_SECONDS = 60;

export function bumpListingsCache() {
  try {
    revalidateTag(LISTINGS_CACHE_TAG, "max");
  } catch {
    // Outside a Next.js request (scripts/tests): skip.
  }
}
