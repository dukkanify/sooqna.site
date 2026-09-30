import type { Listing } from "@/types";
import type { Order } from "@/types/domain/order";
import {
  getCategoryFeatureProfileMeta,
  resolveCategoryFeatureProfile,
} from "@/shared/constants/category-feature-profiles";
import { getListingActionConfig } from "@/shared/constants/listingActionConfig";
import { isPurchasableCategory } from "@/shared/listings/purchase-eligibility";

/**
 * Goods/food checkout listings get escrow unless the row explicitly opts out
 * (`escrowAvailable: false`, e.g. showcase). User listings historically omitted
 * the flag, which hid الضمان المالي and blocked checkout messaging.
 */
export function isListingEscrowEligible(listing: Listing): boolean {
  if (listing.escrowAvailable === false) return false;
  if (listing.escrowAvailable === true) return true;
  return listingCategorySupportsEscrow(listing);
}

/** Persistable default for create/upsert when the seller did not set the flag. */
export function defaultEscrowAvailableForListing(
  listing: Pick<Listing, "categoryId"> & { featureProfile?: Listing["featureProfile"] },
): boolean {
  return listingCategorySupportsEscrow(listing);
}

/** Integrated platform checkout is available for this listing. */
export function hasPlatformCheckout(listing: Listing): boolean {
  return getListingActionConfig(listing).checkoutEnabled;
}

/**
 * True when this listing's category/profile can use escrow at all
 * (goods / retail food). Cars, real estate, jobs, services, etc. return false.
 */
export function listingCategorySupportsEscrow(
  listing: Pick<Listing, "categoryId"> & { featureProfile?: Listing["featureProfile"] },
): boolean {
  const profile = resolveCategoryFeatureProfile(
    listing.categoryId,
    listing.featureProfile,
  );
  if (getCategoryFeatureProfileMeta(profile).escrowEligible) return true;
  return isPurchasableCategory(listing.categoryId, listing.featureProfile);
}

/**
 * Escrow protection applies only when the listing is eligible AND
 * the buyer completes payment fully through the integrated checkout.
 */
export function showsEscrowProtection(listing: Listing): boolean {
  const config = getListingActionConfig(listing);
  return config.checkoutEnabled && isListingEscrowEligible(listing);
}

/**
 * Negative «إعلان عادي — بدون ضمان مالي» copy must never appear.
 * If escrow is not active on the listing, show no escrow-status phrase at all
 * (avoids implying escrow is an option the buyer could have chosen).
 * Positive escrow messaging stays on `showsEscrowProtection` / EscrowProtectionCard.
 */
export function showsNonEscrowIntermediaryNotice(_listing?: Listing): boolean {
  void _listing;
  return false;
}

/**
 * Madmoon Product Condition Verification (photos + video of real condition)
 * applies to escrow-held physical-goods orders only.
 * Excludes jobs, services, real-estate, cars (contact-only), pets.
 */
export function requiresProductConditionVerification(input: {
  listingCategoryId?: string | null;
  escrowStatus?: Order["escrowStatus"] | string;
  status?: Order["status"] | string;
}): boolean {
  const categoryId = input.listingCategoryId?.trim();
  if (!categoryId || !isPurchasableCategory(categoryId)) return false;

  const escrow = input.escrowStatus;
  const status = input.status;
  if (escrow === "refunded" || status === "refunded") return false;
  if (escrow === "released" && status === "released") return false;

  // Paid/held Madmoon path or still awaiting confirmation after documentation.
  if (escrow === "held") return true;
  if (
    status === "paid_held_in_escrow" ||
    status === "delivered" ||
    status === "confirmed" ||
    status === "disputed"
  ) {
    return true;
  }
  return false;
}

export function orderRequiresProductConditionVerification(order: Order): boolean {
  return requiresProductConditionVerification({
    listingCategoryId: order.listingCategoryId,
    escrowStatus: order.escrowStatus,
    status: order.status,
  });
}

export const ESCROW_POLICY_SUMMARY =
  "الضمان المالي يطبق فقط على الإعلانات المؤهلة التي يتم شراؤها والدفع لها بالكامل عبر نظام الدفع المدمج في المنصة.";

export const ESCROW_ACTIVE_NOTICE =
  "هذا الإعلان مؤهل للضمان المالي. عند الشراء والدفع بالكامل داخل المنصة، يُحجز المبلغ بأمان حتى تأكيد الاستلام.";

export const INTERMEDIARY_NOTICE =
  "هذا إعلان عادي — المنصة تعمل كوسيط لعرض الإعلان وربط البائع بالمشتري فقط. لا يتوفر ضمان مالي أو حماية للدفع خارج نظام الشراء المدمج.";
