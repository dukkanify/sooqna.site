import type { Listing } from "@/types";
import { isShowcaseListing } from "@/shared/listings/showcase-listing";

/**
 * Categories that MAY support direct online purchase when checkout is operational.
 * Cars, real estate, jobs, and quote services are never checkout listings.
 */
export const PURCHASABLE_CATEGORY_IDS = new Set([
  "mobiles",
  "electronics",
  "furniture",
  "fashion",
  "kids",
  "sports",
  "books",
  "food",
]);

const CONTACT_ONLY_CATEGORIES = new Set(["pets"]);

/** Client-safe signal that Buy Now may be shown. Server still requires STRIPE_SECRET_KEY. */
export function isCheckoutOperational(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim());
}

export function isPurchasableCategory(categoryId: string): boolean {
  if (CONTACT_ONLY_CATEGORIES.has(categoryId)) return false;
  return PURCHASABLE_CATEGORY_IDS.has(categoryId);
}

export function isWholesaleFoodListing(listing: Listing): boolean {
  return (
    listing.categoryId === "food" &&
    listing.categorySpecs?.saleType === "wholesale"
  );
}

/**
 * Listing could be sold online if Stripe/checkout were operational.
 * Does not inspect button copy — category, type, status, price, and provenance only.
 */
export function listingMeetsPurchaseRules(listing: Listing): boolean {
  if (!isPurchasableCategory(listing.categoryId)) return false;
  if (listing.status !== "active") return false;
  if (isShowcaseListing(listing)) return false;
  if (!Number.isFinite(listing.price) || listing.price <= 0) return false;
  if (listing.currency && listing.currency !== "AED") return false;
  if (isWholesaleFoodListing(listing)) return false;
  return true;
}

/**
 * Central source of truth: this listing may use Buy Now / Stripe Checkout now.
 */
export function isPurchasableListing(listing: Listing): boolean {
  return listingMeetsPurchaseRules(listing) && isCheckoutOperational();
}
