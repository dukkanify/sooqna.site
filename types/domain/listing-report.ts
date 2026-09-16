export type ListingReportReason =
  | "misleading"
  | "fraud"
  | "duplicate"
  | "prohibited"
  | "other";

export type ListingReportStatus =
  | "open"
  | "reviewed"
  | "dismissed"
  | "resolved";

export const LISTING_REPORT_REASON_LABELS: Record<ListingReportReason, string> = {
  misleading: "محتوى مضلل",
  fraud: "احتيال أو نصب",
  duplicate: "إعلان مكرر",
  prohibited: "محتوى ممنوع",
  other: "سبب آخر",
};

export const LISTING_REPORT_STATUS_LABELS: Record<ListingReportStatus, string> = {
  open: "جديد",
  reviewed: "تمت المراجعة",
  dismissed: "مرفوض / لا إجراء",
  resolved: "تم اتخاذ إجراء",
};

export type ListingReport = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug?: string;
  sellerId?: string;
  sellerName?: string;
  reason: ListingReportReason;
  details: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  reporterUserId?: string;
  guest: boolean;
  publicToken?: string;
  status: ListingReportStatus;
  createdAt: string;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedByName?: string;
  listingRejected?: boolean;
  sellerSuspended?: boolean;
};

export type ListingReportReceipt = Pick<
  ListingReport,
  | "id"
  | "listingTitle"
  | "reason"
  | "details"
  | "reporterName"
  | "reporterEmail"
  | "reporterPhone"
  | "guest"
  | "publicToken"
  | "status"
  | "createdAt"
>;
