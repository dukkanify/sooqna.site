import type { Listing } from "@/types";
import type { AppLocale } from "./locale";
import { translateArabicToEnglish } from "./listing-translator";

function englishOrTranslate(
  original: string,
  stored?: string,
): string {
  const fromStore = stored?.trim();
  if (fromStore) return fromStore;
  const live = translateArabicToEnglish(original).trim();
  return live || original;
}

export function listingTitle(
  listing: Pick<Listing, "title" | "titleEnglish">,
  locale: AppLocale,
): string {
  if (locale === "en") {
    return englishOrTranslate(listing.title, listing.titleEnglish);
  }
  return listing.title;
}

export function listingDescription(
  listing: Pick<Listing, "description" | "descriptionEnglish">,
  locale: AppLocale,
): string {
  if (locale === "en") {
    return englishOrTranslate(listing.description, listing.descriptionEnglish);
  }
  return listing.description;
}

export function sellerName(
  seller: Pick<Listing["seller"], "name" | "nameEnglish">,
  locale: AppLocale,
): string {
  if (locale === "en") {
    return seller.nameEnglish?.trim() || seller.name;
  }
  return seller.name;
}

export function listingCopyIsMachine(
  listing: Pick<
    Listing,
    | "titleEnglish"
    | "descriptionEnglish"
    | "titleTranslationSource"
    | "descriptionTranslationSource"
  >,
  field: "title" | "description",
  locale: AppLocale,
): boolean {
  if (locale !== "en") return false;
  const source =
    field === "title"
      ? listing.titleTranslationSource
      : listing.descriptionTranslationSource;
  const stored =
    field === "title" ? listing.titleEnglish : listing.descriptionEnglish;
  if (source === "seller" && stored?.trim()) return false;
  if (source === "machine") return true;
  // Legacy EN without a source is treated as seller-authored.
  if (stored?.trim()) return false;
  return true;
}
