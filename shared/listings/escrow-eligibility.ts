import type { Listing } from "@/types";
import type { Order } from "@/types/domain/order";
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
 * Escrow protection applies only when the listing is eligible AND
 * the buyer completes payment fully through the integrated checkout.
 */
export function showsEscrowProtection(listing: Listing): boolean {
  const config = getListingActionConfig(listing);
  return config.checkoutEnabled && isListingEscrowEligible(listing);
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
