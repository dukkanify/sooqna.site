import type { Listing, ListingSeller } from "@/types";
import { marketplaceSellers } from "@/mock/sellers.mock";
import { searchListings } from "@/services/listings";

export async function getSellerListings(sellerId: string): Promise<Listing[]> {
  if (!sellerId.trim()) return [];
  return searchListings({ sellerId, sort: "newest" });
}

export function getSellerProfile(
  sellerId: string,
  listings: Listing[] = [],
): ListingSeller | undefined {
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
  return listings[0]?.seller;
}
