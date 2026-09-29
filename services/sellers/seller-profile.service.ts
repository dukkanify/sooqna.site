import type { Listing, ListingSeller } from "@/types";
import { marketplaceSellers } from "@/mock/sellers.mock";
import { findUserById } from "@/services/auth/user-store";
import { searchListings } from "@/services/listings";

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

  if (listings[0]?.seller) {
    return listings[0].seller;
  }

  // Fall back to registered account so public social links can still render.
  const account = await findUserById(sellerId);
  if (!account) return undefined;

  const sellerType =
    account.accountType === "company" || account.accountType === "business"
      ? ("business" as const)
      : ("individual" as const);

  return {
    id: account.id,
    name:
      account.businessProfile?.businessName?.trim() || account.fullName,
    ...(account.isVerified ? { isVerified: true } : {}),
    sellerType,
    ...(account.joinedAt ? { joinedAt: account.joinedAt } : {}),
  };
}
