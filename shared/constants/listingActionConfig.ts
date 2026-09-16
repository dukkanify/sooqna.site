import type { Listing } from "@/types";
import {
  isPurchasableListing,
  isWholesaleFoodListing,
} from "@/shared/listings/purchase-eligibility";
import {
  getCategoryFeatureProfileMeta,
  resolveCategoryFeatureProfile,
  type CategoryFeatureProfile,
} from "@/shared/constants/category-feature-profiles";

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

export function getJobListingKind(
  listing: Listing,
): "vacancy" | "seeker" | null {
  const profile = resolveCategoryFeatureProfile(
    listing.categoryId,
    listing.featureProfile,
  );
  if (profile !== "jobs" && listing.categoryId !== "jobs") return null;
  return listing.categorySpecs?.listingType === "seeker" ? "seeker" : "vacancy";
}

function contactConfig(
  primary: ListingActionType,
  extras: Partial<ListingActionConfig> = {},
): ListingActionConfig {
  return {
    primaryAction: primary,
    secondaryActions: ["SEND_MESSAGE"],
    mobileBarActions: ["SEND_MESSAGE", primary],
    checkoutEnabled: false,
    shippingEnabled: false,
    showBuyNow: false,
    showEscrowBadge: false,
    ...extras,
  };
}

function configFromProfile(
  profile: CategoryFeatureProfile,
  listing: Listing,
): ListingActionConfig {
  const meta = getCategoryFeatureProfileMeta(profile);

  if (profile === "jobs") {
    const kind = getJobListingKind(listing);
    if (kind === "seeker") {
      return contactConfig("SEND_MESSAGE", {
        secondaryActions: [],
        mobileBarActions: ["SEND_MESSAGE"],
      });
    }
    return contactConfig("APPLY_JOB", {
      secondaryActions: ["SEND_MESSAGE"],
      mobileBarActions: ["SEND_MESSAGE", "APPLY_JOB"],
    });
  }

  if (profile === "real_estate") {
    return contactConfig("BOOK_VIEWING", {
      mobileBarActions: ["SEND_MESSAGE", "BOOK_VIEWING"],
    });
  }

  if (profile === "services" || isWholesaleFoodListing(listing)) {
    return contactConfig("REQUEST_QUOTE", {
      secondaryActions: ["BOOK_SERVICE", "SEND_MESSAGE"],
      mobileBarActions: ["SEND_MESSAGE", "REQUEST_QUOTE"],
    });
  }

  if (profile === "vehicles") {
    return contactConfig("CONTACT_SELLER");
  }

  if (profile === "goods" || profile === "food") {
    if (isPurchasableListing(listing)) {
      return {
        primaryAction: "BUY_NOW",
        secondaryActions: ["CONTACT_SELLER", "SEND_MESSAGE"],
        mobileBarActions: ["SEND_MESSAGE", "BUY_NOW"],
        checkoutEnabled: true,
        shippingEnabled: true,
        showBuyNow: true,
        showEscrowBadge: meta.escrowEligible,
      };
    }
    return contactConfig("CONTACT_SELLER");
  }

  return contactConfig(meta.primaryAction as ListingActionType);
}

/**
 * Single source of truth for listing intent → primary CTA.
 * Buy Now is never shown unless isPurchasableListing() is true (Stripe + category rules).
 * Admin-created categories use featureProfile; built-ins keep legacy categoryId rules.
 */
export function getListingActionConfig(listing: Listing): ListingActionConfig {
  const profile = resolveCategoryFeatureProfile(
    listing.categoryId,
    listing.featureProfile,
  );
  return configFromProfile(profile, listing);
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
