/**
 * Marketplace listing seeds are local-dev only.
 * Vercel Preview/Production and NODE_ENV=production never auto-inject fake listings.
 */
export function allowMockCatalogSeed(): boolean {
  if (process.env.ALLOW_MOCK_CATALOG === "true") return true;
  if (process.env.ALLOW_MOCK_CATALOG === "false") return false;
  if (process.env.VERCEL) return false;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}

/** Confirmed mock/seed listing ids from mock/*.mock.ts — never matches local-/admin-/e2e- user records. */
export function isMockSeedListingId(id: string): boolean {
  return (
    /^listing-(car|re|mob|elec|furn|svc|job|fashion|pets|kids|books|sports|food)-\d{3}$/.test(
      id,
    ) ||
    /^listing-extra-\d+$/.test(id) ||
    /^user-listing-\d{3}$/.test(id)
  );
}

const QA_SELLER_NAMES = new Set(["Preview E2E User", "QA26 User"]);

export type FixtureListingRef = {
  id?: string;
  slug?: string;
  title?: string;
  seller?: { name?: string };
};

/**
 * Confirmed fixture/demo marketplace rows — seed catalog, E2E preview ads,
 * and 26/26 QA listings. Evidence: mock ids, known QA slug prefixes, titles
 * "إعلان تجريبي…", and dedicated QA seller display names.
 */
export function isConfirmedFixtureListing(listing: FixtureListingRef): boolean {
  const id = listing.id?.trim() ?? "";
  const slug = listing.slug?.trim() || id;
  const title = listing.title?.trim() ?? "";
  const sellerName = listing.seller?.name?.trim() ?? "";

  if (id && isMockSeedListingId(id)) return true;
  if (slug && isMockSeedListingId(slug)) return true;
  if (slug === "office-business-bay") return true;
  if (/^e2e-preview-[a-f0-9]+$/i.test(slug)) return true;
  if (/^e2e-[a-f0-9]{8}$/i.test(slug)) return true;
  if (/^qa26-[a-z]+-[a-f0-9]+$/i.test(slug)) return true;
  if (/^إعلان تجريبي\b/.test(title)) return true;
  if (/^E2E Preview Test Listing$/i.test(title)) return true;
  if (QA_SELLER_NAMES.has(sellerName)) return true;
  return false;
}

/** SQL predicate matching isConfirmedFixtureListing — AND NOT (this). */
export const FIXTURE_LISTING_SQL = `(
  id ~ '^listing-(car|re|mob|elec|furn|svc|job|fashion|pets|kids|books|sports|food)-[0-9]{3}$'
  OR id ~ '^listing-extra-[0-9]+$'
  OR id ~ '^user-listing-[0-9]{3}$'
  OR slug ~ '^e2e-preview-[a-f0-9]+$'
  OR slug ~ '^e2e-[a-f0-9]{8}$'
  OR slug ~ '^qa26-[a-z]+-[a-f0-9]+$'
  OR slug = 'office-business-bay'
  OR COALESCE(payload->>'title', '') LIKE 'إعلان تجريبي%'
  OR COALESCE(payload->>'title', '') ILIKE 'E2E Preview Test Listing'
  OR COALESCE(payload->'seller'->>'name', '') IN ('Preview E2E User', 'QA26 User')
)`;
