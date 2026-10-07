export type SupportTopic =
  | "order"
  | "listing"
  | "escrow"
  | "account"
  | "other";

/** Canonical ticket statuses for Contact Us tracking. */
export type SupportMessageStatus =
  | "received"
  | "in_review"
  | "replied"
  | "closed";

/** Legacy codes persisted before ticket redesign — normalized on read. */
export type LegacySupportMessageStatus =
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
    received: "مستلم",
    in_review: "قيد المراجعة",
    replied: "تم الرد",
    closed: "مغلق",
  };

export function normalizeSupportMessageStatus(
  value: string | undefined | null,
): SupportMessageStatus {
  switch (value) {
    case "received":
    case "in_review":
    case "replied":
    case "closed":
      return value;
    case "open":
      return "received";
    case "reviewed":
      return "in_review";
    case "resolved":
      return "replied";
    case "dismissed":
      return "closed";
    default:
      return "received";
  }
}

export type SupportMessage = {
  id: string;
  /** Public follow-up number shown to the requester (e.g. SQ-20261006-A3F9). */
  ticketNumber: string;
  name: string;
  email: string;
  topic: SupportTopic;
  message: string;
  status: SupportMessageStatus;
  createdAt: string;
  /** Set when the submitter was logged in. */
  userId?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedByName?: string;
};

/** Safe public view for tracking pages / profile lists. */
export type SupportTicketReceipt = {
  ticketNumber: string;
  topic: SupportTopic;
  status: SupportMessageStatus;
  statusLabel: string;
  createdAt: string;
  name: string;
  email: string;
  message: string;
  resolutionNote?: string;
  resolvedAt?: string;
};
