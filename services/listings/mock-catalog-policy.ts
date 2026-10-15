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
 * - `local-1789075968004` / `sony-ipad-pro` — keyboard-mash junk
 * - `local-1788919686292` / `toyota-patrol-2026` — diverged local/server copy
 *   (seller card title/price/image disagreed with the localStorage detail page)
 */
const PUBLIC_HIDDEN_LISTING_IDS = new Set([
  "local-1789075968004",
  "local-1788919686292",
  /** Admin-posted demo car that was featured on production home. */
  "local-1790600982192",
  /** Keyboard-mash junk that reached production (Gghhhhhh). */
  "local-1791391793620",
]);
const PUBLIC_HIDDEN_LISTING_SLUGS = new Set([
  "sony-ipad-pro",
  "toyota-patrol-2026",
  "01-982192",
  "gghhhhhh-793620",
]);

export type FixtureListingRef = {
  id?: string;
  slug?: string;
  title?: string;
  titleEnglish?: string;
  seller?: { name?: string };
};

export type ListingIntegrityClass = "CONFIRMED_FAKE" | "MANUAL_REVIEW" | "REAL";

/**
 * Public-catalog only: hide obvious QA/demo titles so production home/search
 * never feature “إعلان تجريبي …” rows. Does NOT mark them confirmed fixtures
 * (admin can still see/review them).
 */
/** Arabic titles don't play well with JS `\b` — use space/dash/end anchors. */
const ARABIC_QA_TITLE =
  /^إعلان (?:تجريبي|مرفوض)(?:\s|$|—|-|–)/;
const ARABIC_QA_TITLE_EXACT = /^إعلان (?:تجريبي|مرفوض)$/;

/**
 * Keyboard-mash / nonsense titles that slipped past moderation.
 * Conservative: repeated chars, or a single Latin/Arabic token with almost no vowels.
 */
export function isKeyboardMashTitle(title: string | undefined): boolean {
  const raw = title?.trim() ?? "";
  if (raw.length < 5) return false;
  const compact = raw.replace(/\s+/g, "");
  if (compact.length < 5) return false;
  if (/(.)\1{3,}/u.test(compact)) return true;

  if (/^[A-Za-z]+$/.test(compact) && compact.length >= 6) {
    const vowels = (compact.match(/[aeiouAEIOU]/g) ?? []).length;
    if (vowels / compact.length <= 0.15) return true;
  }

  // Single Arabic token with almost no matres lectionis (ا و ي …).
  if (
    /^[\u0600-\u06FF]+$/.test(compact) &&
    compact.length >= 8 &&
    !/\s/.test(raw)
  ) {
    const vowels = (compact.match(/[اأإآوىيئؤ]/g) ?? []).length;
    if (vowels / compact.length <= 0.12) return true;
  }

  return false;
}

export function isPublicQaTitleListing(listing: FixtureListingRef): boolean {
  const title = listing.title?.trim() ?? "";
  const titleEnglish = listing.titleEnglish?.trim() ?? "";
  return (
    ARABIC_QA_TITLE.test(title) ||
    ARABIC_QA_TITLE_EXACT.test(title) ||
    /^E2E Preview Test Listing$/i.test(title) ||
    /^E2E Preview Test Listing$/i.test(titleEnglish) ||
    /^Listing(?:\s+)تجريبي(?:\s|$|—|-|–)/i.test(titleEnglish) ||
    /^Listing(?:\s+)تجريبي$/i.test(titleEnglish) ||
    // Live cert stamps from scripts/audit-e2e-http.mjs (e.g. "تويوتا كامري qa-audit-…")
    /\bqa-audit\b/i.test(title) ||
    /\bqa-audit\b/i.test(titleEnglish) ||
    isKeyboardMashTitle(title) ||
    isKeyboardMashTitle(titleEnglish)
  );
}

/** SQL matching {@link isPublicQaTitleListing}. */
export const PUBLIC_QA_TITLE_SQL = `(
  COALESCE(payload->>'title', '') ~ '^إعلان تجريبي($|[[:space:]])'
  OR COALESCE(payload->>'title', '') ~ '^إعلان مرفوض($|[[:space:]])'
  OR COALESCE(payload->>'title', '') ~* '^e2e preview test listing$'
  OR COALESCE(payload->>'titleEnglish', '') ~* '^e2e preview test listing$'
  OR COALESCE(payload->>'titleEnglish', '') ~* '^listing[[:space:]]*تجريبي'
  OR COALESCE(payload->>'title', '') ~* 'qa-audit'
  OR COALESCE(payload->>'titleEnglish', '') ~* 'qa-audit'
  OR COALESCE(payload->>'title', '') ~ '(.)\\1{3,}'
  OR COALESCE(payload->>'titleEnglish', '') ~ '(.)\\1{3,}'
)`;

function looksLikeQaTitleOrName(listing: FixtureListingRef): boolean {
  const sellerName = listing.seller?.name?.trim() ?? "";
  return isPublicQaTitleListing(listing) || QA_SELLER_NAMES.has(sellerName);
}

function isE2eFixtureKey(value: string): boolean {
  return /^e2e-/i.test(value) || /qa-audit/i.test(value);
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
  OR COALESCE(payload->>'id', '') ~ '^listing-(car|re|mob|elec|furn|svc|job|fashion|pets|kids|books|sports|food)-[0-9]{3}$'
  OR id ~ '^listing-extra-[0-9]+$'
  OR COALESCE(payload->>'id', '') ~ '^listing-extra-[0-9]+$'
  OR id ~ '^user-listing-[0-9]{3}$'
  OR COALESCE(payload->>'id', '') ~ '^user-listing-[0-9]{3}$'
  OR id ~ '^e2e-'
  OR COALESCE(payload->>'id', '') ~ '^e2e-'
  OR slug ~ '^e2e-'
  OR COALESCE(payload->>'slug', '') ~ '^e2e-'
  OR id ~* 'qa-audit'
  OR COALESCE(payload->>'id', '') ~* 'qa-audit'
  OR slug ~* 'qa-audit'
  OR COALESCE(payload->>'slug', '') ~* 'qa-audit'
  OR id ~ '^qa26-[a-z]+-[a-f0-9]+$'
  OR COALESCE(payload->>'id', '') ~ '^qa26-[a-z]+-[a-f0-9]+$'
  OR slug ~ '^qa26-[a-z]+-[a-f0-9]+$'
  OR COALESCE(payload->>'slug', '') ~ '^qa26-[a-z]+-[a-f0-9]+$'
  OR slug = 'office-business-bay'
  OR COALESCE(payload->>'slug', '') = 'office-business-bay'
  OR id = 'local-1789075968004'
  OR COALESCE(payload->>'id', '') = 'local-1789075968004'
  OR id = 'local-1788919686292'
  OR COALESCE(payload->>'id', '') = 'local-1788919686292'
  OR id = 'local-1790600982192'
  OR COALESCE(payload->>'id', '') = 'local-1790600982192'
  OR id = 'local-1791391793620'
  OR COALESCE(payload->>'id', '') = 'local-1791391793620'
  OR slug = 'sony-ipad-pro'
  OR COALESCE(payload->>'slug', '') = 'sony-ipad-pro'
  OR slug = 'toyota-patrol-2026'
  OR COALESCE(payload->>'slug', '') = 'toyota-patrol-2026'
  OR slug = '01-982192'
  OR COALESCE(payload->>'slug', '') = '01-982192'
  OR slug = 'gghhhhhh-793620'
  OR COALESCE(payload->>'slug', '') = 'gghhhhhh-793620'
)`;
