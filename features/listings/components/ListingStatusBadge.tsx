import type { ListingStatus } from "@/types";
import {
  listingStatusLabels,
  listingStatusLabelsEn,
} from "@/shared/constants/listingStatuses";
import { Badge } from "@/shared/ui/Badge";

type ListingStatusBadgeProps = {
  locale?: "ar" | "en";
  status: ListingStatus;
};

const statusVariants: Record<
  ListingStatus,
  "new" | "muted" | "pending" | "sold" | "rejected" | "escrow"
> = {
  active: "new",
  reserved: "escrow",
  sold: "sold",
  draft: "muted",
  expired: "sold",
  pending_review: "pending",
  rejected: "rejected",
};

export function ListingStatusBadge({
  locale = "ar",
  status,
}: ListingStatusBadgeProps) {
  const label =
    locale === "en"
      ? listingStatusLabelsEn[status]
      : listingStatusLabels[status];
  return <Badge variant={statusVariants[status]}>{label}</Badge>;
}
