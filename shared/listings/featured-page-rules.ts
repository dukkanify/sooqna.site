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

/** User-facing rule chips shown on `/featured`. */
export function featuredPageRuleLabels(packageDays: number): string[] {
  const days = Math.max(1, Math.round(packageDays));
  return [
    "الظهور: إعلانات مدفوعة التمييز فقط (نشط أو محجوز)",
    "المدة: طوال أيام الباقة بعد تأكيد الدفع",
    `مدة الباقة الحالية: ${days} يوماً`,
    "الترتيب: الأحدث تمييزاً أولاً",
  ];
}
