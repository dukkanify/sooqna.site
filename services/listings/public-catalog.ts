/** Stable public identity — table id and payload.id can disagree. */
export function listingPublicKey(listing: {
  id?: string;
  slug?: string;
}): string {
  const id = listing.id?.trim() ?? "";
  if (id) return id;
  return listing.slug?.trim() ?? "";
}

/**
 * One row per listing for home / search / category grids.
 * Duplicate Neon rows (same payload.id, different table ids) inflated
 * “4 إعلان” above two cards.
 */
export function dedupeListingsById<T extends { id?: string; slug?: string }>(
  listings: T[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const listing of listings) {
    const key = listingPublicKey(listing);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(listing);
  }
  return out;
}

/**
 * Search/category toolbar total: unique fetched cards win unless the
 * page was truncated at the server cap.
 */
export function resolveUniqueResultTotal(
  uniqueFetched: number,
  uniqueCounted: number,
  resultLimit: number,
): number {
  if (uniqueFetched < resultLimit) return uniqueFetched;
  return Math.max(uniqueCounted, uniqueFetched);
}
