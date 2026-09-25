export const SHOWCASE_SOURCE = "SOOQNA_SHOWCASE";
export const SHOWCASE_SELLER_ID = "seller-sooqna-showcase";
export const SHOWCASE_FLAG_KEY = "showcase_catalog";

/** SQL predicate matching isShowcaseListing — hide from public, never delete rows. */
export const SHOWCASE_LISTING_SQL = `(
  COALESCE(payload->>'source', '') = '${SHOWCASE_SOURCE}'
  OR COALESCE(payload->>'isDemo', '') IN ('true', 't')
  OR id LIKE 'showcase-%'
  OR seller_id = '${SHOWCASE_SELLER_ID}'
)`;

export type ShowcaseCatalogFlag = "published" | "hidden" | "removed";

export type ShowcaseListingRef = {
  id?: string;
  isDemo?: boolean;
  source?: string;
  seller?: { id?: string };
  categoryId?: string;
};

export function isShowcaseListing(listing: ShowcaseListingRef): boolean {
  if (listing.source === SHOWCASE_SOURCE || listing.isDemo === true) return true;
  if (listing.seller?.id === SHOWCASE_SELLER_ID) return true;
  return Boolean(listing.id?.startsWith("showcase-"));
}

/** Jobs and food do not use New/Used as a product condition. */
export function showsListingCondition(listing: ShowcaseListingRef): boolean {
  return (
    listing.categoryId !== "jobs" &&
    listing.categoryId !== "food" &&
    listing.categoryId !== "real-estate" &&
    listing.categoryId !== "services"
  );
}
