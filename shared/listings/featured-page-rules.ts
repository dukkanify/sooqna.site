import type { Listing } from "@/types";

/**
 * Product contract for `/featured` (صفحة المميزة).
 *
 * Destination: paid Featured package placements only — not editorial
 * “best of”, not escrow messaging, not a general market preview.
 */
export const FEATURED_PAGE_PURPOSE = {
  ar: {
    eyebrow: "المميزة",
    title: "إعلانات مميزة",
    summary:
      "هنا تظهر فقط الإعلانات التي فعّل أصحابها باقة التمييز المدفوعة — لظهور أوضح في سوقنا خلال مدة الباقة. ليست قائمة «أفضل العروض» العامة، ولا تعني أن كل إعلان مشمول بالضمان المالي.",
  },
} as const;

/** Visibility rules for the Featured page and home featured rail. */
export const FEATURED_APPEARANCE_RULES = {
  /** Must be marked featured after successful package payment (or admin). */
  requireIsFeatured: true,
  /** Package window must not be expired (`featuredUntil`). */
  requireActiveWindow: true,
  /** Public catalog statuses only. */
  publicStatuses: ["active", "reserved"] as const,
  /** Never showcase/demo or confirmed fixtures (handled by public queries). */
  excludeDemoAndFixtures: true,
} as const;

/** Featured package still within `featuredUntil` (missing date = open-ended). */
export function isFeaturedWindowActive(
  listing: Pick<Listing, "isFeatured" | "featuredUntil">,
  nowMs = Date.now(),
): boolean {
  if (listing.isFeatured !== true) return false;
  if (!listing.featuredUntil) return true;
  const until = Date.parse(listing.featuredUntil);
  if (Number.isNaN(until)) return true;
  return until > nowMs;
}

/**
 * Sort: most recently featured first.
 * Same package length ⇒ later `featuredUntil` ≈ newer payment.
 * Tie-break: newer `postedAt`, then id.
 */
export function compareFeaturedListings(a: Listing, b: Listing): number {
  const aUntil = Date.parse(a.featuredUntil ?? "") || 0;
  const bUntil = Date.parse(b.featuredUntil ?? "") || 0;
  if (bUntil !== aUntil) return bUntil - aUntil;
  const aPosted = Date.parse(a.postedAt ?? "") || 0;
  const bPosted = Date.parse(b.postedAt ?? "") || 0;
  if (bPosted !== aPosted) return bPosted - aPosted;
  return b.id.localeCompare(a.id);
}

export function isEligibleFeaturedPageListing(
  listing: Listing,
  nowMs = Date.now(),
): boolean {
  if (!isFeaturedWindowActive(listing, nowMs)) return false;
  return listing.status === "active" || listing.status === "reserved";
}

export function sortFeaturedPageListings(listings: Listing[]): Listing[] {
  return [...listings].sort(compareFeaturedListings);
}

export function listingLocationKey(
  listing: Pick<Listing, "emirate" | "city">,
): string {
  return (listing.emirate || listing.city || "").trim();
}

function remainingHasUnusedCategory(
  pool: Listing[],
  usedIds: Set<string>,
  usedCategories: Set<string>,
): boolean {
  return pool.some(
    (listing) =>
      !usedIds.has(listing.id) && !usedCategories.has(listing.categoryId),
  );
}

function remainingHasUnusedLocation(
  pool: Listing[],
  usedIds: Set<string>,
  usedLocations: Set<string>,
): boolean {
  return pool.some((listing) => {
    if (usedIds.has(listing.id)) return false;
    const loc = listingLocationKey(listing);
    return loc.length > 0 && !usedLocations.has(loc);
  });
}

/**
 * Homepage featured rail: paid + active window, newest package first,
 * then avoid repeating the same category or emirate/city while alternatives remain.
 */
export function pickDiverseFeaturedListings(
  listings: Listing[],
  limit: number,
  nowMs = Date.now(),
): Listing[] {
  const ranked = sortFeaturedPageListings(
    listings.filter((listing) => isEligibleFeaturedPageListing(listing, nowMs)),
  );
  if (limit <= 0) return [];
  const picked: Listing[] = [];
  const usedIds = new Set<string>();
  const usedCategories = new Set<string>();
  const usedLocations = new Set<string>();

  const tryPick = (spreadCategory: boolean, spreadLocation: boolean) => {
    for (const listing of ranked) {
      if (picked.length >= limit) return;
      if (usedIds.has(listing.id)) continue;
      const loc = listingLocationKey(listing);
      if (
        spreadCategory &&
        usedCategories.has(listing.categoryId) &&
        remainingHasUnusedCategory(ranked, usedIds, usedCategories)
      ) {
        continue;
      }
      if (
        spreadLocation &&
        loc &&
        usedLocations.has(loc) &&
        remainingHasUnusedLocation(ranked, usedIds, usedLocations)
      ) {
        continue;
      }
      usedIds.add(listing.id);
      usedCategories.add(listing.categoryId);
      if (loc) usedLocations.add(loc);
      picked.push(listing);
    }
  };

  tryPick(true, true);
  tryPick(true, false);
  tryPick(false, false);
  return picked;
}

/**
 * Listing grids (home lists, search, categories): paid featured first,
 * then the caller’s sort. Price sorts still keep featured above regular ads.
 */
export function compareListingsWithFeaturedPriority(
  a: Listing,
  b: Listing,
  sort?: "newest" | "price_asc" | "price_desc",
  nowMs = Date.now(),
): number {
  const aFeatured = isEligibleFeaturedPageListing(a, nowMs) ? 0 : 1;
  const bFeatured = isEligibleFeaturedPageListing(b, nowMs) ? 0 : 1;
  if (aFeatured !== bFeatured) return aFeatured - bFeatured;
  if (aFeatured === 0) {
    const featuredCmp = compareFeaturedListings(a, b);
    if (featuredCmp !== 0) return featuredCmp;
  }
  if (sort === "price_asc") return a.price - b.price;
  if (sort === "price_desc") return b.price - a.price;
  const aPosted = a.postedAt ?? a.id;
  const bPosted = b.postedAt ?? b.id;
  return bPosted.localeCompare(aPosted);
}

/** User-facing rule chips shown on `/featured`. */
export function featuredPageRuleLabels(packageDays: number): string[] {
  const days = Math.max(1, Math.round(packageDays));
  return [
    "الظهور: إعلانات مدفوعة التمييز فقط (نشط أو محجوز)",
    "الموقع: أول الصفحة الرئيسية ومقدمة قوائم الإعلانات",
    "المدة: طوال أيام الباقة بعد تأكيد الدفع",
    `مدة الباقة الحالية: ${days} يوماً`,
    "الترتيب: الأحدث تمييزاً أولاً — مع تنويع التصنيف والموقع دون تكرار",
  ];
}
