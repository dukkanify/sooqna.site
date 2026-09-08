import type { HomeCityHighlight } from "@/types";
import {
  countActiveListingsByEmirate,
  countActivePublicListings,
} from "@/services/listings/listing-queries";

/** Live public catalog counts — server-only (Postgres). */
export async function getHomeCityHighlights(): Promise<HomeCityHighlight[]> {
  const counts = await countActiveListingsByEmirate();
  return [
    { cityId: "dubai", listingCount: counts.get("dubai") ?? 0 },
    { cityId: "abu-dhabi", listingCount: counts.get("abu-dhabi") ?? 0 },
    { cityId: "sharjah", listingCount: counts.get("sharjah") ?? 0 },
    { cityId: "ajman", listingCount: counts.get("ajman") ?? 0 },
    { cityId: "umm-al-quwain", listingCount: counts.get("umm-al-quwain") ?? 0 },
    { cityId: "rak", listingCount: counts.get("ras-al-khaimah") ?? 0 },
    { cityId: "fujairah", listingCount: counts.get("fujairah") ?? 0 },
  ];
}

export async function getAuthTrustPoints() {
  const { getRequestLocale } = await import("@/shared/i18n/locale");
  const { uaeActiveListingsLabel } = await import("@/shared/i18n/count-labels");
  const locale = await getRequestLocale();
  const activeListings = await countActivePublicListings();

  const points = [
    "منصة موثوقة للبيع والشراء في الإمارات",
    "توثيق البائعين والمشترين",
    "دعم بالعربية على مدار الساعة",
  ];
  if (activeListings > 0) {
    points.push(uaeActiveListingsLabel(activeListings, locale));
  }
  return points;
}
