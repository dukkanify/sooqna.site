import { cache } from "react";
import type { Listing, ListingSearchFilters } from "@/types";
import { listingMatchesQuery } from "@/shared/listings/listing-specs";
import { isListingFeaturedActive } from "@/features/listings/components/listing-card-badges";
import { queryListings } from "@/services/listings/listing-queries";
import {
  getAllListings,
  getListingBySlug as getStoredListingBySlug,
} from "@/services/listings/listing-store";

export type { ListingSearchFilters };

const SEARCH_FETCH_LIMIT = 60;
const SEARCH_RESULT_LIMIT = 48;
const RELATED_LIMIT = 3;

export const getListings = cache(async (): Promise<Listing[]> => {
  return getAllListings();
});

export async function getMyListings(userId?: string): Promise<Listing[]> {
  if (!userId) {
    const listings = await getAllListings();
    return listings.filter((listing) => listing.id.startsWith("local-"));
  }
  return queryListings({
    sellerId: userId,
    slim: "full",
    sort: "newest",
  });
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  return getStoredListingBySlug(slug);
}

export const getFeaturedListings = cache(async (): Promise<Listing[]> => {
  const listings = await queryListings({
    featured: true,
    limit: 24,
    slim: "card",
    sort: "newest",
    status: "active",
  });
  return listings.filter((listing) => isListingFeaturedActive(listing));
});

export async function getRelatedListings(
  categoryId: string,
  excludedId: string,
): Promise<Listing[]> {
  return queryListings({
    categoryId,
    excludeId: excludedId,
    limit: RELATED_LIMIT,
    slim: "card",
    sort: "newest",
    status: "active",
  });
}

function matchesQuery(listing: Listing, query: string): boolean {
  return listingMatchesQuery(listing, query);
}

export async function searchListings(
  filters: ListingSearchFilters = {},
): Promise<Listing[]> {
  const normalizedQuery = filters.query?.trim();
  const rows = await queryListings({
    area: filters.area,
    categoryId: filters.categoryId,
    city: filters.emirate ?? filters.city,
    condition: filters.condition,
    country: filters.country,
    emirate: filters.emirate ?? filters.city,
    featured: filters.featured || undefined,
    limit: SEARCH_FETCH_LIMIT,
    maxPrice: filters.maxPrice,
    minPrice: filters.minPrice,
    query: normalizedQuery,
    slim: "card",
    sort: filters.sort ?? "newest",
    status: "active",
  });

  const results = rows
    .filter((listing) =>
      normalizedQuery ? matchesQuery(listing, normalizedQuery) : true,
    )
    .filter((listing) =>
      filters.premium ? listing.isPremium === true : true,
    );

  return results.slice(0, SEARCH_RESULT_LIMIT);
}
