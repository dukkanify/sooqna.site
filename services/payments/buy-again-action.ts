import {
  listingMeetsPurchaseRules,
  type PurchaseEligibilityInput,
} from "@/shared/listings/purchase-eligibility";
import type { Order, OrderStatus } from "@/types/domain/order";

export type BuyAgainKind =
  | "complete_payment"
  | "retry_payment"
  | "buy_again"
  | "repurchase"
  | "unavailable"
  | "listing_gone"
  | "seller_inactive"
  | "none";

export type BuyAgainDecision = {
  kind: BuyAgainKind;
  label: string;
  message?: string;
  listingExists: boolean;
  listingPublic: boolean;
  listingSlug?: string;
  listingTitle?: string;
  currentPrice?: number;
  previousPrice?: number;
  priceChanged: boolean;
  /** Pending order to resume (this order, or another open pending for the same listing). */
  resumeOrderId?: string;
  checkoutPath?: string;
};

export type BuyAgainResolveInput = {
  order: Pick<
    Order,
    | "id"
    | "status"
    | "paymentStatus"
    | "buyerId"
    | "listingId"
    | "listingSlug"
    | "listingTitle"
    | "fees"
    | "stripeCheckoutSessionId"
    | "sellerId"
  >;
  viewerId: string;
  listing: PurchaseEligibilityInput | null;
  listingDeleted?: boolean;
  sellerCanSell: boolean;
  checkoutConfigured: boolean;
  checkoutSessionOpen?: boolean | null;
  pendingOrderIdForListing?: string;
};

const BUY_AGAIN_LABEL = "شراء مرة أخرى";
const REPURCHASE_LABEL = "إعادة الشراء";
const COMPLETE_PAYMENT_LABEL = "إكمال الدفع";
const RETRY_PAYMENT_LABEL = "إعادة محاولة الدفع";
const UNAVAILABLE_MESSAGE = "المنتج غير متوفر حالياً";
const LISTING_GONE_MESSAGE = "هذا المنتج لم يعد متاحاً للشراء.";
const SELLER_INACTIVE_MESSAGE = "البائع غير متاح حالياً للبيع.";

const COMPLETED_STATUSES = new Set<OrderStatus>([
  "paid_held_in_escrow",
  "delivered",
  "confirmed",
  "released",
]);

const REPURCHASE_STATUSES = new Set<OrderStatus>(["refunded", "cancelled"]);

function emptyDecision(
  kind: BuyAgainKind,
  extras: Partial<BuyAgainDecision> = {},
): BuyAgainDecision {
  return {
    kind,
    label: "",
    listingExists: false,
    listingPublic: false,
    priceChanged: false,
    ...extras,
  };
}

function listingPublic(listing: PurchaseEligibilityInput | null): boolean {
  return Boolean(listing && (!listing.status || listing.status === "active"));
}

function listingCheckoutPath(
  listing: PurchaseEligibilityInput | null,
  order: BuyAgainResolveInput["order"],
): string | undefined {
  const ref =
    (listing && "slug" in listing && typeof listing.slug === "string" && listing.slug) ||
    order.listingSlug ||
    order.listingId;
  if (!ref) return undefined;
  return `/checkout?listingId=${encodeURIComponent(ref)}&fromOrder=${encodeURIComponent(order.id)}`;
}

function withListingFields(
  order: BuyAgainResolveInput["order"],
  listing: PurchaseEligibilityInput | null,
): Pick<
  BuyAgainDecision,
  | "listingExists"
  | "listingPublic"
  | "listingSlug"
  | "listingTitle"
  | "currentPrice"
  | "previousPrice"
  | "priceChanged"
> {
  const currentPrice =
    listing && Number.isFinite(listing.price) ? listing.price : undefined;
  const previousPrice = order.fees.productPrice;
  const priceChanged =
    currentPrice != null && Number.isFinite(previousPrice) && currentPrice !== previousPrice;
  const slug =
    listing && "slug" in listing && typeof listing.slug === "string"
      ? listing.slug
      : order.listingSlug;
  return {
    listingExists: Boolean(listing),
    listingPublic: listingPublic(listing),
    listingSlug: slug,
    listingTitle: listing && "title" in listing && typeof listing.title === "string"
      ? listing.title
      : order.listingTitle,
    currentPrice,
    previousPrice,
    priceChanged,
  };
}

function isListingPurchasableNow(
  listing: PurchaseEligibilityInput,
  checkoutConfigured: boolean,
): boolean {
  // listingMeetsPurchaseRules is the listing half of isPurchasableListing();
  // checkoutConfigured is the Stripe/checkout half (plus server secret).
  return checkoutConfigured && listingMeetsPurchaseRules(listing);
}

function unavailableDecision(
  kind: Extract<BuyAgainKind, "unavailable" | "listing_gone" | "seller_inactive">,
  order: BuyAgainResolveInput["order"],
  listing: PurchaseEligibilityInput | null,
): BuyAgainDecision {
  const message =
    kind === "listing_gone"
      ? LISTING_GONE_MESSAGE
      : kind === "seller_inactive"
        ? SELLER_INACTIVE_MESSAGE
        : UNAVAILABLE_MESSAGE;
  return {
    kind,
    label: "",
    message,
    ...withListingFields(order, listing),
  };
}

/**
 * Pure source of truth for which primary action Order Details may show.
 * Does not read cookies, Stripe, or the database.
 */
export function resolveBuyAgainAction(input: BuyAgainResolveInput): BuyAgainDecision {
  const { order, viewerId, listing, listingDeleted, sellerCanSell, checkoutConfigured } =
    input;

  if (!viewerId || !order.buyerId || order.buyerId !== viewerId) {
    return emptyDecision("none");
  }

  if (order.status === "pending_payment") {
    const sessionOpen = input.checkoutSessionOpen;
    const hasSession = Boolean(order.stripeCheckoutSessionId);
    const failed = order.paymentStatus === "failed";
    const kind: BuyAgainKind =
      failed || sessionOpen === false || !hasSession
        ? "retry_payment"
        : "complete_payment";
    return {
      kind,
      label: kind === "retry_payment" ? RETRY_PAYMENT_LABEL : COMPLETE_PAYMENT_LABEL,
      resumeOrderId: order.id,
      ...withListingFields(order, listing),
    };
  }

  if (order.status === "disputed") {
    return emptyDecision("none", withListingFields(order, listing));
  }

  const canRepurchase =
    COMPLETED_STATUSES.has(order.status) || REPURCHASE_STATUSES.has(order.status);
  if (!canRepurchase) {
    return emptyDecision("none", withListingFields(order, listing));
  }

  if (input.pendingOrderIdForListing && input.pendingOrderIdForListing !== order.id) {
    return {
      kind: "complete_payment",
      label: COMPLETE_PAYMENT_LABEL,
      resumeOrderId: input.pendingOrderIdForListing,
      message: "يوجد طلب بانتظار الدفع لنفس المنتج.",
      ...withListingFields(order, listing),
    };
  }

  if (!listing || listingDeleted) {
    return unavailableDecision("listing_gone", order, listing);
  }

  if (listing.status && listing.status !== "active") {
    return unavailableDecision("listing_gone", order, listing);
  }

  if (!sellerCanSell) {
    return unavailableDecision("seller_inactive", order, listing);
  }

  if (!isListingPurchasableNow(listing, checkoutConfigured)) {
    return unavailableDecision("unavailable", order, listing);
  }

  const kind: BuyAgainKind = REPURCHASE_STATUSES.has(order.status)
    ? "repurchase"
    : "buy_again";
  return {
    kind,
    label: kind === "repurchase" ? REPURCHASE_LABEL : BUY_AGAIN_LABEL,
    checkoutPath: listingCheckoutPath(listing, order),
    ...withListingFields(order, listing),
  };
}

export function isBuyAgainMutationKind(kind: BuyAgainKind): boolean {
  return (
    kind === "complete_payment" ||
    kind === "retry_payment" ||
    kind === "buy_again" ||
    kind === "repurchase"
  );
}
