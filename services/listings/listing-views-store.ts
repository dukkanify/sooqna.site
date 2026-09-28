import type { Listing } from "@/types";
import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

export type ListingViewCount = {
  id: string;
  count: number;
  updatedAt: string;
};

const store = createPayloadCollectionStore<ListingViewCount>({
  table: "marketplace_listing_views",
  fileName: "sooqna-listing-views.json",
  orderBySql: "(payload->>'count')::int DESC NULLS LAST, updated_at DESC",
});

let scoresCache: Map<string, number> | null = null;
let scoresCacheAt = 0;
const CACHE_TTL_MS = 15_000;

function invalidateCache() {
  scoresCache = null;
  scoresCacheAt = 0;
}

export async function getListingViewScores(): Promise<Map<string, number>> {
  if (scoresCache && Date.now() - scoresCacheAt < CACHE_TTL_MS) {
    return scoresCache;
  }
  const rows = await store.listAll();
  const next = new Map<string, number>();
  for (const row of rows) {
    if (!row?.id || typeof row.count !== "number") continue;
    next.set(row.id, Math.max(0, Math.floor(row.count)));
  }
  scoresCache = next;
  scoresCacheAt = Date.now();
  return next;
}

export async function getListingViewCount(listingId: string): Promise<number> {
  const scores = await getListingViewScores();
  return scores.get(listingId) ?? 0;
}

/** Replace seeded/demo view numbers with durable actual visit counts. */
export async function applyListingViewCounts<T extends Listing>(
  listings: T[],
): Promise<T[]> {
  if (listings.length === 0) return listings;
  const scores = await getListingViewScores();
  let changed = false;
  const next = listings.map((listing) => {
    const count = scores.get(listing.id) ?? 0;
    if (listing.views === count) return listing;
    changed = true;
    return { ...listing, views: count };
  });
  return changed ? next : listings;
}

export async function applyListingViewCount<T extends Listing>(
  listing: T | undefined | null,
): Promise<T | undefined> {
  if (!listing) return undefined;
  const [next] = await applyListingViewCounts([listing]);
  return next;
}

/**
 * Record one unique visit. Returns the new total.
 * Callers should dedupe per browser session before posting.
 */
export async function incrementListingView(
  listingId: string,
): Promise<number> {
  const id = listingId.trim();
  if (!id) throw new Error("INVALID_LISTING");

  const scores = await getListingViewScores();
  const previous = scores.get(id) ?? 0;
  const count = previous + 1;
  const updatedAt = new Date().toISOString();
  await store.upsert({ id, count, updatedAt });
  scores.set(id, count);
  scoresCache = scores;
  scoresCacheAt = Date.now();
  return count;
}

export function clearListingViewsCacheForTests() {
  invalidateCache();
}
