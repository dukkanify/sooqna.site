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
import { galleryForListingProduct } from "@/shared/constants/listing-product-media";
import { unsplashUrl, verifiedPhotoPools } from "@/shared/constants/image-fallbacks";

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
const FEATURED_FETCH = 24;
const PREVIEW_SHOW = 4;
const FEATURED_SHOW = 6;
const CATALOG_FETCH = 160;
const NEARBY_SHOW = 12;
const SECTION_SHOW = 4;

/** Strip query/size so the same Unsplash photo collides across listings. */
function coverKey(url: string | undefined): string {
  if (!url?.trim()) return "";
  try {
    const parsed = new URL(url.trim());
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.trim().split("?")[0]?.toLowerCase() ?? "";
  }
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const key = coverKey(url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

/** Candidate covers for a listing: own media first, then regenerated product gallery. */
function coverCandidates(listing: Listing): string[] {
  const own = [
    ...(listing.images ?? []),
    listing.imageUrl ?? "",
  ]
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

  const generated = galleryForListingProduct({
    categoryId: listing.categoryId,
    count: 8,
    seed: `${listing.id}-home-cover`,
    title: listing.title,
    titleEnglish: listing.titleEnglish,
  });

  const categoryPool = verifiedPhotoPools[
    listing.categoryId as keyof typeof verifiedPhotoPools
  ];
  const categoryUrls = categoryPool
    ? categoryPool.map((photoId) => unsplashUrl(photoId, 1200))
    : [];

  return uniqueUrls([...own, ...generated, ...categoryUrls]);
}

function withCover(listing: Listing, cover: string): Listing {
  return {
    ...listing,
    imageUrl: cover,
    images: [cover],
  };
}

/**
 * Pick listings without repeating ids OR cover photos.
 * If a listing's cover was already shown, rotate to another candidate image;
 * if none left, skip it and keep scanning the pool.
 */
function takeDiverse(
  listings: Listing[],
  limit: number,
  usedIds: Set<string>,
  usedCovers: Set<string>,
): Listing[] {
  const out: Listing[] = [];

  for (const listing of listings) {
    if (out.length >= limit) break;
    if (usedIds.has(listing.id)) continue;

    const candidates = coverCandidates(listing);
    const fresh = candidates.find((url) => !usedCovers.has(coverKey(url)));
    if (!fresh) continue;

    usedIds.add(listing.id);
    usedCovers.add(coverKey(fresh));
    out.push(withCover(listing, fresh));
  }

  return out;
}

async function buildHomeFeed(): Promise<HomeFeed> {
  const sectionDefs = mockHomeCategorySections.slice(0, HOME_SECTION_LIMIT);

  // Two round-trips instead of 1 + N category queries — much faster under Postgres quota.
  const [featuredRows, catalogRows] = await Promise.all([
    queryListings({
      featured: true,
      limit: FEATURED_FETCH,
      slim: "card",
      sort: "newest",
      status: "active",
    }),
    queryListings({
      limit: CATALOG_FETCH,
      slim: "card",
      sort: "newest",
      status: "active",
    }),
  ]);

  const usedIds = new Set<string>();
  const usedCovers = new Set<string>();
  const activeFeatured = featuredRows.filter((listing) =>
    isListingFeaturedActive(listing),
  );

  // Prefer featured pool first, then backfill from catalog so preview/featured stay full.
  const featuredPool = [
    ...activeFeatured,
    ...catalogRows.filter((listing) => !activeFeatured.some((item) => item.id === listing.id)),
  ];

  const preview = takeDiverse(featuredPool, PREVIEW_SHOW, usedIds, usedCovers);
  const featured = takeDiverse(featuredPool, FEATURED_SHOW, usedIds, usedCovers);
  const nearbySource = takeDiverse(catalogRows, NEARBY_SHOW, usedIds, usedCovers);

  const sections = sectionDefs.map((section) => ({
    ...section,
    items: takeDiverse(
      catalogRows.filter((listing) => listing.categoryId === section.categoryId),
      SECTION_SHOW,
      usedIds,
      usedCovers,
    ),
  }));

  return { featured, nearbySource, preview, sections };
}

const getHomeFeedCached = unstable_cache(
  buildHomeFeed,
  ["sooqna-home-feed-v12-unique-covers"],
  {
    revalidate: HOME_FEED_REVALIDATE_SECONDS,
    tags: [LISTINGS_CACHE_TAG],
  },
);

/** Cached homepage slices — unique ids and unique cover photos across sections. */
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
