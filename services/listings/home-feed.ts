import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Listing } from "@/types";
import { mockHomeCategorySections } from "@/mock";
import { isListingFeaturedActive } from "@/features/listings/components/listing-card-badges";
import { slimListingForCard } from "@/services/listings/listing-card-model";
import { queryListings } from "@/services/listings/listing-queries";
import {
  HOME_FEED_REVALIDATE_SECONDS,
  LISTINGS_CACHE_TAG,
} from "@/services/listings/listings-cache";

export type HomeListingCard = Listing;
export { slimListingForCard };

export type HomeFeed = {
  featured: Listing[];
  nearbySource: Listing[];
  preview: Listing[];
  sections: Array<{
    categoryId: string;
    description: string;
    eyebrow: string;
    items: Listing[];
    title: string;
    variant: "sand" | "white";
  }>;
};

const HOME_SECTION_LIMIT = 13;
const FEATURED_FETCH = 16;
const PREVIEW_SHOW = 4;
const FEATURED_SHOW = 6;
const NEARBY_FETCH = 18;
const SECTION_FETCH = 8;

function takeUnique(
  listings: Listing[],
  limit: number,
  usedIds: Set<string>,
): Listing[] {
  const out: Listing[] = [];
  for (const listing of listings) {
    if (usedIds.has(listing.id)) continue;
    usedIds.add(listing.id);
    out.push(listing);
    if (out.length >= limit) break;
  }
  return out;
}

async function buildHomeFeed(): Promise<HomeFeed> {
  const sectionDefs = mockHomeCategorySections.slice(0, HOME_SECTION_LIMIT);

  const [featuredRows, nearbyRows, ...sectionRows] = await Promise.all([
    queryListings({
      featured: true,
      limit: FEATURED_FETCH,
      slim: "card",
      sort: "newest",
      status: "active",
    }),
    queryListings({
      limit: NEARBY_FETCH,
      slim: "card",
      sort: "newest",
      status: "active",
    }),
    ...sectionDefs.map((section) =>
      queryListings({
        categoryId: section.categoryId,
        limit: SECTION_FETCH,
        slim: "card",
        sort: "newest",
        status: "active",
      }),
    ),
  ]);

  const usedIds = new Set<string>();
  const activeFeatured = featuredRows.filter((listing) =>
    isListingFeaturedActive(listing),
  );

  // Preview + Featured share the featured pool but never repeat an id on the page.
  const preview = takeUnique(activeFeatured, PREVIEW_SHOW, usedIds);
  const featured = takeUnique(activeFeatured, FEATURED_SHOW, usedIds);
  const nearbySource = takeUnique(nearbyRows, 12, usedIds);

  const sections = sectionDefs.map((section, index) => ({
    ...section,
    items: takeUnique(sectionRows[index] ?? [], 4, usedIds),
  }));

  return { featured, nearbySource, preview, sections };
}

const getHomeFeedCached = unstable_cache(buildHomeFeed, ["sooqna-home-feed-v5-dedupe"], {
  revalidate: HOME_FEED_REVALIDATE_SECONDS,
  tags: [LISTINGS_CACHE_TAG],
});

/** Cached homepage slices — cover-only cards, capped sections, no cross-section duplicates. */
export const getHomeFeed = cache(async (): Promise<HomeFeed> => {
  return getHomeFeedCached();
});

export const getSearchSuggestionTitles = cache(
  async (): Promise<Array<Pick<Listing, "slug" | "title" | "titleEnglish">>> => {
    const listings = await queryListings({
      limit: 40,
      slim: "card",
      sort: "newest",
      status: "active",
    });
    return listings.map((listing) => ({
      slug: listing.slug,
      title: listing.title,
      titleEnglish: listing.titleEnglish,
    }));
  },
);
