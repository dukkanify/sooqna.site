/**
 * Unified advertiser display name: merchant/company name when set, else full name.
 * Used at listing create and when syncing existing ads after a profile rename.
 */
export function sellerDisplayNameFromProfile(user: {
  fullName?: string | null;
  businessProfile?: { businessName?: string | null } | null;
}): string {
  const merchant = user.businessProfile?.businessName?.trim();
  if (merchant) return merchant;
  return (user.fullName ?? "").trim();
}

/** Patch every listing owned by `sellerId` when the snapshot name differs. */
export function applySellerDisplayNameToListings<
  T extends { seller: { id: string; name: string } },
>(listings: T[], sellerId: string, displayName: string): { changed: number; listings: T[] } {
  const name = displayName.trim();
  if (!sellerId || !name) {
    return { changed: 0, listings };
  }

  let changed = 0;
  const next = listings.map((listing) => {
    if (listing.seller.id !== sellerId) return listing;
    if (listing.seller.name === name) return listing;
    changed += 1;
    return {
      ...listing,
      seller: {
        ...listing.seller,
        name,
      },
    };
  });

  return { changed, listings: next };
}
