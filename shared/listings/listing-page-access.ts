import type { Listing, ListingStatus, UserProfile } from "@/types";
import { isPublicListingStatus } from "@/shared/constants/listingStatuses";

export type ListingPageAccess =
  | { kind: "allow"; listing: Listing; isOwner: boolean; isAdmin: boolean; isPreview: boolean }
  | { kind: "login_required"; listing: Listing }
  | { kind: "not_found" };

/**
 * Decide whether a viewer may open a listing detail page.
 * Public statuses are open to everyone. Non-public rows stay visible to the
 * seller (and admins) as a preview — guests are sent to login instead of 404
 * so notification/email links keep working after submit.
 */
export function resolveListingPageAccess(
  listing: Listing | undefined | null,
  session: UserProfile | null | undefined,
): ListingPageAccess {
  if (!listing) return { kind: "not_found" };

  const isAdmin = session?.role === "admin";
  const isOwner = Boolean(session && listing.seller?.id === session.id);
  const isPublic = isPublicListingStatus(listing.status);

  if (isPublic || isOwner || isAdmin) {
    return {
      kind: "allow",
      listing,
      isOwner,
      isAdmin,
      isPreview: !isPublic && (isOwner || isAdmin),
    };
  }

  if (!session) {
    return { kind: "login_required", listing };
  }

  return { kind: "not_found" };
}

/** Statuses where the seller should see an explicit moderation/lifecycle banner. */
export function listingNeedsOwnerStatusBanner(status: ListingStatus): boolean {
  return (
    status === "pending_review" ||
    status === "rejected" ||
    status === "draft" ||
    status === "expired" ||
    status === "sold"
  );
}
