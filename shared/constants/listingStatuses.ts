import type { ListingStatus } from "@/types";

/** Marketplace lifecycle labels (Arabic primary). */
export const listingStatusLabels: Record<ListingStatus, string> = {
  active: "متاح",
  reserved: "محجوز",
  sold: "مباع",
  expired: "منتهي",
  draft: "مسودة",
  pending_review: "قيد المراجعة",
  rejected: "مرفوض",
};

export const listingStatusLabelsEn: Record<ListingStatus, string> = {
  active: "Available",
  reserved: "Reserved",
  sold: "Sold",
  expired: "Expired",
  draft: "Draft",
  pending_review: "Pending review",
  rejected: "Rejected",
};

export const listingStatusDescriptions: Record<ListingStatus, string> = {
  active: "الإعلان ظاهر للمشترين ويمكن استقبال المحادثات.",
  reserved: "الإعلان محجوز مؤقتاً — ما زال ظاهراً مع شارة محجوز.",
  sold: "تم البيع — الإعلان لم يعد يظهر في نتائج البحث.",
  expired: "انتهت مدة الإعلان ويمكن إعادة تنشيطه.",
  draft: "الإعلان محفوظ كمسودة ويحتاج إلى إكمال البيانات.",
  pending_review: "الإعلان بانتظار مراجعة فريق المنصة.",
  rejected: "الإعلان يحتاج إلى تعديل قبل إعادة الإرسال.",
};

/** Statuses visible in public browse/search. */
export const PUBLIC_LISTING_STATUSES: ListingStatus[] = ["active", "reserved"];

export function isPublicListingStatus(status: ListingStatus): boolean {
  return PUBLIC_LISTING_STATUSES.includes(status);
}

/** Seller-settable marketplace states (clear buyer-facing lifecycle). */
export const SELLER_MARKETPLACE_STATUSES: ListingStatus[] = [
  "active",
  "reserved",
  "sold",
  "expired",
];
