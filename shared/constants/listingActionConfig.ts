import type { Listing } from "@/types";
import { isShowcaseListing } from "@/shared/listings/showcase-listing";

export type ListingActionType =
  | "BUY_NOW"
  | "RESERVE"
  | "CONTACT_SELLER"
  | "BOOK_VIEWING"
  | "REQUEST_QUOTE"
  | "APPLY_JOB"
  | "BOOK_SERVICE"
  | "SEND_MESSAGE";

export type ListingActionConfig = {
  checkoutEnabled: boolean;
  mobileBarActions: ListingActionType[];
  primaryAction: ListingActionType;
  secondaryActions: ListingActionType[];
  shippingEnabled: boolean;
  showBuyNow: boolean;
  showEscrowBadge: boolean;
};

const PRODUCT_CATEGORIES = new Set([
  "mobiles",
  "electronics",
  "furniture",
  "fashion",
  "kids",
  "sports",
  "books",
  "pets",
  "food",
]);

const CONTACT_ONLY_CATEGORIES = new Set(["pets"]);

export function getJobListingKind(
  listing: Listing,
): "vacancy" | "seeker" | null {
  if (listing.categoryId !== "jobs") return null;
  return listing.categorySpecs?.listingType === "seeker" ? "seeker" : "vacancy";
}

function isPurchasableProduct(listing: Listing): boolean {
  if (listing.status !== "active") return false;
  if (isShowcaseListing(listing)) return false;
  if (!PRODUCT_CATEGORIES.has(listing.categoryId)) return false;
  if (CONTACT_ONLY_CATEGORIES.has(listing.categoryId)) return false;
  return Boolean(listing.escrowAvailable);
}

function isCarPurchasable(listing: Listing): boolean {
  if (isShowcaseListing(listing)) return false;
  return (
    listing.categoryId === "cars" &&
    listing.status === "active" &&
    Boolean(listing.escrowAvailable) &&
    !listing.negotiable
  );
}

/**
 * Single source of truth for listing intent → primary CTA.
 * Showcase listings keep the category CTA but never enable checkout.
 */
export function getListingActionConfig(listing: Listing): ListingActionConfig {
  const { categoryId } = listing;
  const jobKind = getJobListingKind(listing);

  if (jobKind === "seeker") {
    return {
      primaryAction: "SEND_MESSAGE",
      secondaryActions: [],
      mobileBarActions: ["SEND_MESSAGE"],
      checkoutEnabled: false,
      shippingEnabled: false,
      showBuyNow: false,
      showEscrowBadge: false,
    };
  }

  if (jobKind === "vacancy") {
    return {
      primaryAction: "APPLY_JOB",
      secondaryActions: ["SEND_MESSAGE"],
      mobileBarActions: ["SEND_MESSAGE", "APPLY_JOB"],
      checkoutEnabled: false,
      shippingEnabled: false,
      showBuyNow: false,
      showEscrowBadge: false,
    };
  }

  if (categoryId === "real-estate") {
    return {
      primaryAction: "BOOK_VIEWING",
      secondaryActions: ["SEND_MESSAGE"],
      mobileBarActions: ["SEND_MESSAGE", "BOOK_VIEWING"],
      checkoutEnabled: false,
      shippingEnabled: false,
      showBuyNow: false,
      showEscrowBadge: false,
    };
  }

  if (categoryId === "services") {
    return {
      primaryAction: "REQUEST_QUOTE",
      secondaryActions: ["BOOK_SERVICE", "SEND_MESSAGE"],
      mobileBarActions: ["SEND_MESSAGE", "REQUEST_QUOTE"],
      checkoutEnabled: false,
      shippingEnabled: false,
      showBuyNow: false,
      showEscrowBadge: false,
    };
  }

  if (categoryId === "cars") {
    const purchasable = isCarPurchasable(listing);
    const contact = "CONTACT_SELLER" as const;
    return {
      primaryAction: purchasable ? "RESERVE" : contact,
      secondaryActions: ["SEND_MESSAGE"],
      mobileBarActions: ["SEND_MESSAGE", purchasable ? "RESERVE" : contact],
      checkoutEnabled: purchasable,
      shippingEnabled: false,
      showBuyNow: purchasable,
      showEscrowBadge: purchasable,
    };
  }

  if (isPurchasableProduct(listing)) {
    return {
      primaryAction: "BUY_NOW",
      secondaryActions: ["SEND_MESSAGE"],
      mobileBarActions: ["SEND_MESSAGE", "BUY_NOW"],
      checkoutEnabled: true,
      shippingEnabled: true,
      showBuyNow: true,
      showEscrowBadge: true,
    };
  }

  const contact: ListingActionType = "CONTACT_SELLER";
  return {
    primaryAction: contact,
    secondaryActions: ["SEND_MESSAGE"],
    mobileBarActions: ["SEND_MESSAGE", contact],
    checkoutEnabled: false,
    shippingEnabled: false,
    showBuyNow: false,
    showEscrowBadge: false,
  };
}

export const ACTION_LABELS: Record<ListingActionType, string> = {
  BUY_NOW: "شراء الآن",
  RESERVE: "احجز المركبة",
  CONTACT_SELLER: "تواصل مع البائع",
  BOOK_VIEWING: "استفسر عن العقار",
  REQUEST_QUOTE: "طلب عرض سعر",
  APPLY_JOB: "تقديم على الوظيفة",
  BOOK_SERVICE: "طلب الخدمة",
  SEND_MESSAGE: "محادثة",
};

export function getListingActionLabel(
  listing: Listing,
  action: ListingActionType = getListingActionConfig(listing).primaryAction,
): string {
  if (action === "SEND_MESSAGE" && getJobListingKind(listing) === "seeker") {
    return "تواصل مع الباحث عن عمل";
  }
  return ACTION_LABELS[action];
}
