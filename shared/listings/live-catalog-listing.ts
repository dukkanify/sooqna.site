/** Provenance marker — curated seed inventory (public may show; not auto-expired). */
export const LIVE_MARKETPLACE_SOURCE = "SOOQNA_LIVE_MARKETPLACE";

/** SQL predicate matching isLiveCatalogListing. */
export const LIVE_MARKETPLACE_LISTING_SQL = `(
  COALESCE(payload->>'source', '') = '${LIVE_MARKETPLACE_SOURCE}'
  OR id LIKE 'live-mkt-%'
)`;

export type LiveCatalogListingRef = {
  id?: string;
  source?: string;
};

export function isLiveCatalogListing(listing: LiveCatalogListingRef): boolean {
  if (listing.source === LIVE_MARKETPLACE_SOURCE) return true;
  return Boolean(listing.id?.startsWith("live-mkt-"));
}
