export type SupportTopic =
  | "order"
  | "listing"
  | "escrow"
  | "account"
  | "other";

export type SupportMessageStatus =
  | "open"
  | "reviewed"
  | "resolved"
  | "dismissed";

export const SUPPORT_TOPIC_LABELS: Record<SupportTopic, string> = {
  order: "طلب / دفع",
  listing: "إعلان",
  escrow: "ضمان مالي",
  account: "حساب",
  other: "أخرى",
};

export const SUPPORT_MESSAGE_STATUS_LABELS: Record<SupportMessageStatus, string> =
  {
    open: "جديد",
    reviewed: "تمت المراجعة",
    resolved: "تم الرد",
    dismissed: "مغلق",
  };

export type SupportMessage = {
  id: string;
  name: string;
  email: string;
  topic: SupportTopic;
  message: string;
  status: SupportMessageStatus;
  createdAt: string;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedByName?: string;
};
