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

/**
 * Live junk rows that must stay out of the public catalog (id/slug evidence only).
 * `local-1789075968004` is keyboard-mash "Sony iPad Pro" — kept in DB / QA blocklist,
 * but must not appear in search, home, or public detail pages.
 */
const PUBLIC_HIDDEN_LISTING_IDS = new Set(["local-1789075968004"]);
const PUBLIC_HIDDEN_LISTING_SLUGS = new Set(["sony-ipad-pro"]);

export type FixtureListingRef = {
  id?: string;
  slug?: string;
  title?: string;
  seller?: { name?: string };
};

export type ListingIntegrityClass = "CONFIRMED_FAKE" | "MANUAL_REVIEW" | "REAL";

function looksLikeQaTitleOrName(listing: FixtureListingRef): boolean {
  const title = listing.title?.trim() ?? "";
  const sellerName = listing.seller?.name?.trim() ?? "";
  return (
    /^إعلان تجريبي\b/.test(title) ||
    /^إعلان مرفوض\b/.test(title) ||
    /^E2E Preview Test Listing$/i.test(title) ||
    QA_SELLER_NAMES.has(sellerName)
  );
}

function isE2eFixtureKey(value: string): boolean {
  return /^e2e-/i.test(value);
}

/**
 * Confirmed fixture rows only — seed catalog ids and known QA/E2E slugs.
 * Never classify from title or seller name alone.
 */
export function isConfirmedFixtureListing(listing: FixtureListingRef): boolean {
  const id = listing.id?.trim() ?? "";
  const slug = listing.slug?.trim() || id;

  if (id && isMockSeedListingId(id)) return true;
  if (slug && isMockSeedListingId(slug)) return true;
  if (slug === "office-business-bay") return true;
  if (id && PUBLIC_HIDDEN_LISTING_IDS.has(id)) return true;
  if (slug && PUBLIC_HIDDEN_LISTING_SLUGS.has(slug)) return true;
  if (isE2eFixtureKey(id) || isE2eFixtureKey(slug)) return true;
  if (/^qa26-[a-z]+-[a-f0-9]+$/i.test(id)) return true;
  if (/^qa26-[a-z]+-[a-f0-9]+$/i.test(slug)) return true;
  return false;
}

/**
 * Title/name looks like QA but id/slug are not proven fixtures.
 * Do not auto-hide or delete — report for human review.
 */
export function needsManualReviewListing(listing: FixtureListingRef): boolean {
  if (isConfirmedFixtureListing(listing)) return false;
  return looksLikeQaTitleOrName(listing);
}

export function classifyListingIntegrity(
  listing: FixtureListingRef,
): ListingIntegrityClass {
  if (isConfirmedFixtureListing(listing)) return "CONFIRMED_FAKE";
  if (needsManualReviewListing(listing)) return "MANUAL_REVIEW";
  return "REAL";
}

/** SQL predicate matching isConfirmedFixtureListing (id/slug evidence only). */
export const FIXTURE_LISTING_SQL = `(
  id ~ '^listing-(car|re|mob|elec|furn|svc|job|fashion|pets|kids|books|sports|food)-[0-9]{3}$'
  OR id ~ '^listing-extra-[0-9]+$'
  OR id ~ '^user-listing-[0-9]{3}$'
  OR id ~ '^e2e-'
  OR slug ~ '^e2e-'
  OR id ~ '^qa26-[a-z]+-[a-f0-9]+$'
  OR slug ~ '^qa26-[a-z]+-[a-f0-9]+$'
  OR slug = 'office-business-bay'
  OR id = 'local-1789075968004'
  OR slug = 'sony-ipad-pro'
)`;
