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

/**
 * Whether curated live-catalog seed may be published / shown publicly.
 * - Explicit `SOOQNA_LIVE_CATALOG=true|false` always wins.
 * - Production defaults OFF (real marketplace only).
 * - Local / Preview defaults ON for demos unless disabled.
 */
export function isLiveCatalogEnabled(): boolean {
  if (process.env.SOOQNA_LIVE_CATALOG === "true") return true;
  if (process.env.SOOQNA_LIVE_CATALOG === "false") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview") {
    return false;
  }
  return true;
}
