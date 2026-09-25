import type { Listing } from "@/types";
import type { AppLocale } from "@/shared/i18n/locale";
import { intlLocale } from "@/shared/i18n/locale";

/** Compact marketplace density — always 2-up (never full-width), 4-up on large screens. */
export const MARKETPLACE_LISTING_GRID_CLASS =
  "grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4";

const numberFormatOptions: Intl.NumberFormatOptions = {
  maximumFractionDigits: 0,
  numberingSystem: "latn",
};

export const listingPriceFormatter = new Intl.NumberFormat(
  "ar-AE",
  numberFormatOptions,
);

export function formatListingPrice(
  amount: number,
  locale: AppLocale = "ar",
): string {
  return new Intl.NumberFormat(intlLocale(locale), numberFormatOptions).format(
    amount,
  );
}

export function getListingHref(listing: Listing): string {
  // Prefer slug routes so synced local-* ads resolve from the server catalog
  // (localStorage-only pages 404 after delete while homepage cards still linked).
  if (listing.slug?.trim()) {
    return `/listings/${listing.slug}`;
  }
  return listing.id.startsWith("local-")
    ? `/listings/local/${listing.id}`
    : `/listings/${listing.id}`;
}

export function getListingLocation(listing: Listing): string {
  if (listing.area) {
    return `${listing.area}، ${listing.emirate ?? listing.city}`;
  }
  return listing.emirate ?? listing.city;
}

/**
 * Real listing media only — never substitute Unsplash/stock as seller photos.
 * Empty array means the UI should show a neutral "no image" state.
 */
export function getListingImages(listing: Listing): string[] {
  const fromGallery = (listing.images ?? [])
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));
  if (fromGallery.length > 0) {
    return fromGallery;
  }
  const cover = listing.imageUrl?.trim();
  return cover ? [cover] : [];
}

export function getListingImageUrl(listing: Listing): string | undefined {
  return getListingImages(listing)[0];
}

export const conditionLabels: Record<Listing["condition"], string> = {
  excellent: "ممتاز",
  new: "جديد",
  used: "مستعمل",
  refurbished: "مجدّد",
  for_parts: "للقطع",
  not_working: "لا يعمل",
};

export const conditionBadgeVariant: Record<
  Listing["condition"],
  "new" | "muted" | "premium"
> = {
  excellent: "premium",
  new: "new",
  used: "muted",
  refurbished: "premium",
  for_parts: "muted",
  not_working: "muted",
};

export function formatPostedTime(postedAt?: string): string {
  if (!postedAt) {
    return "—";
  }

  const posted = new Date(postedAt);
  if (Number.isNaN(posted.getTime())) {
    return "—";
  }

  // Deterministic calendar label — avoid Date.now()/relative time (SSR hydration mismatch).
  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ] as const;

  return `${posted.getUTCDate()} ${months[posted.getUTCMonth()]}`;
}

export function formatViews(views: number, locale: AppLocale = "ar"): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    numberingSystem: "latn",
  }).format(views);
}
