import { cache } from "react";
import type { Listing, ListingSearchFilters } from "@/types";
import { isListingFeaturedActive } from "@/features/listings/components/listing-card-badges";
import { queryListings, countMatchingListings } from "@/services/listings/listing-queries";
import { isConfirmedFixtureListing } from "@/services/listings/mock-catalog-policy";
import { isShowcaseListing } from "@/shared/listings/showcase-listing";
import {
  getAllListings,
  getListingBySlug as getStoredListingBySlug,
} from "@/services/listings/listing-store";

export type { ListingSearchFilters };

const SEARCH_FETCH_LIMIT = 280;
const SEARCH_RESULT_LIMIT = 260;
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
    includeFixtures: true,
    sellerId: userId,
    slim: "full",
    sort: "newest",
  });
}

export async function getListingBySlug(
  slug: string,
  options?: { includeFixtures?: boolean },
): Promise<Listing | undefined> {
  const listing = await getStoredListingBySlug(slug);
  if (!listing) return undefined;
  if (
    options?.includeFixtures !== true &&
    (isConfirmedFixtureListing(listing) || isShowcaseListing(listing))
  ) {
    return undefined;
  }
  const copy = { ...listing };
  delete copy.isUrgent;
  return copy;
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

export async function searchListings(
  filters: ListingSearchFilters = {},
): Promise<Listing[]> {
  const normalizedQuery = filters.query?.trim();
  const rows = await queryListings({
    area: filters.area,
    categoryId: filters.categoryId,
    categorySpecs: filters.categorySpecs,
    city: filters.emirate ?? filters.city,
    condition: filters.condition,
    country: filters.country,
    emirate: filters.emirate ?? filters.city,
    featured: filters.featured || undefined,
    limit: SEARCH_FETCH_LIMIT,
    maxPrice: filters.maxPrice,
    minPrice: filters.minPrice,
    query: normalizedQuery,
    sellerId: filters.sellerId,
    slim: "card",
    sort: filters.sort ?? "newest",
    specMax: filters.specMax,
    specMin: filters.specMin,
    status: "active",
    subcategory: filters.subcategory,
  });

  const results = rows.filter((listing) =>
    filters.premium ? listing.isPremium === true : true,
  );

  return results.slice(0, SEARCH_RESULT_LIMIT);
}

export async function countSearchListings(
  filters: ListingSearchFilters = {},
): Promise<number> {
  const normalizedQuery = filters.query?.trim();
  return countMatchingListings({
    area: filters.area,
    categoryId: filters.categoryId,
    categorySpecs: filters.categorySpecs,
    city: filters.emirate ?? filters.city,
    condition: filters.condition,
    country: filters.country,
    emirate: filters.emirate ?? filters.city,
    featured: filters.featured || undefined,
    maxPrice: filters.maxPrice,
    minPrice: filters.minPrice,
    query: normalizedQuery,
    sellerId: filters.sellerId,
    sort: filters.sort ?? "newest",
    specMax: filters.specMax,
    specMin: filters.specMin,
    status: "active",
    subcategory: filters.subcategory,
  });
}
