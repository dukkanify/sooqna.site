import type { Listing, ListingSeller } from "@/types";
import { marketplaceSellers } from "@/mock/sellers.mock";
import { findUserById } from "@/services/auth/user-store";
import { searchListings } from "@/services/listings";
import { sellerDisplayNameFromProfile } from "@/shared/listings/seller-display-name";

export async function getSellerListings(sellerId: string): Promise<Listing[]> {
  if (!sellerId.trim()) return [];
  return searchListings({ sellerId, sort: "newest" });
}

export async function getSellerProfile(
  sellerId: string,
  listings: Listing[] = [],
): Promise<ListingSeller | undefined> {
  const fromCatalog = Object.values(marketplaceSellers).find(
    (seller) => seller.id === sellerId,
  );
  if (fromCatalog) {
    return {
      avatarUrl: fromCatalog.avatarUrl,
      completedTransactions: fromCatalog.completedTransactions,
      id: fromCatalog.id,
      isVerified: fromCatalog.isVerified,
      joinedAt: fromCatalog.joinedAt,
      name: fromCatalog.name,
      nameEnglish: fromCatalog.nameEnglish,
      rating: fromCatalog.rating,
      responseTime: fromCatalog.responseTime,
      reviewCount: fromCatalog.reviewCount,
      sellerType: fromCatalog.sellerType,
    };
  }

  // Prefer live account display name so renames show even before listing sync lands.
  const account = await findUserById(sellerId);
  const snapshot = listings[0]?.seller;
  if (account) {
    const sellerType =
      account.accountType === "company" || account.accountType === "business"
        ? ("business" as const)
        : ("individual" as const);
    return {
      ...(snapshot ?? {}),
      id: account.id,
      name: sellerDisplayNameFromProfile(account),
      ...(account.isVerified ? { isVerified: true } : {}),
      sellerType,
      ...(account.joinedAt ? { joinedAt: account.joinedAt } : {}),
    };
  }

  return snapshot;
}
