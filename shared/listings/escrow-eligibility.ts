import type { Listing } from "@/types";
import type { Order } from "@/types/domain/order";
import {
  getCategoryFeatureProfileMeta,
  resolveCategoryFeatureProfile,
} from "@/shared/constants/category-feature-profiles";
import { getListingActionConfig } from "@/shared/constants/listingActionConfig";
import { isPurchasableCategory } from "@/shared/listings/purchase-eligibility";

/** Listing is marked eligible for escrow when paid through the platform. */
export function isListingEscrowEligible(listing: Listing): boolean {
  return listing.escrowAvailable === true;
}

/** Integrated platform checkout is available for this listing. */
export function hasPlatformCheckout(listing: Listing): boolean {
  return getListingActionConfig(listing).checkoutEnabled;
}

/**
 * True when this listing's category/profile can use escrow at all
 * (goods / retail food). Cars, real estate, jobs, services, etc. return false.
 */
export function listingCategorySupportsEscrow(listing: Listing): boolean {
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
 * "Regular listing — no escrow" notice: only when escrow could apply to the
 * category but this listing is not under platform escrow protection.
 * Never show for contact-only categories where escrow does not exist.
 */
export function showsNonEscrowIntermediaryNotice(listing: Listing): boolean {
  if (showsEscrowProtection(listing)) return false;
  return listingCategorySupportsEscrow(listing);
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
