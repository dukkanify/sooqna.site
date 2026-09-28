import type { Listing } from "@/types";
import { showsNonEscrowIntermediaryNotice } from "@/shared/listings/escrow-eligibility";

type ListingPlatformNoticeProps = {
  listing: Listing;
};

/**
 * Negative «بدون ضمان مالي» banner is intentionally never shown.
 * Escrow-protected listings use EscrowProtectionCard instead.
 */
export function ListingPlatformNotice({ listing }: ListingPlatformNoticeProps) {
  if (!showsNonEscrowIntermediaryNotice(listing)) {
    return null;
  }
  return null;
}
