import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Listing } from "@/types";
import { mockHomeCategorySections } from "@/mock";
import { slimListingForCard } from "@/services/listings/listing-card-model";
import { queryListings } from "@/services/listings/listing-queries";
import {
  HOME_FEED_REVALIDATE_SECONDS,
  LISTINGS_CACHE_TAG,
} from "@/services/listings/listings-cache";
import { galleryForListingProduct } from "@/shared/constants/listing-product-media";
import { sortByMostViewed } from "@/services/listings/home-feed-rank";
import { pickDiverseFeaturedListings } from "@/shared/listings/featured-page-rules";

export type HomeListingCard = Listing;
export { slimListingForCard };
export { sortByMostViewed } from "@/services/listings/home-feed-rank";

export type HomeFeed = {
  catalogCount: number;
  featured: Listing[];
  nearbySource: Listing[];
  /**
   * @deprecated Removed from homepage UI — kept empty so older callers stay safe.
   * Market “preview” duplicated Featured; sections are most-viewed instead.
   */
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
const FEATURED_SHOW = 6;
const CATALOG_FETCH = 200;
const NEARBY_SHOW = 8;
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

/** Candidate covers for a listing: own media first, then same-product gallery only. */
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

  return uniqueUrls([...own, ...generated]);
}

function withCover(listing: Listing, cover: string): Listing {
  const original = coverKey(listing.imageUrl) || coverKey(listing.images?.[0]);
  const nextKey = coverKey(cover);
  if (original && original === nextKey) {
    return listing;
  }
  return {
    ...listing,
    imageUrl: cover,
    images: [cover],
  };
}

/**
 * Pick listings without repeating ids OR cover photos across the whole homepage.
 * Pass 1 keeps original covers when unique; pass 2 remaps within the product gallery.
 */
export function takeDiverse(
  listings: Listing[],
  limit: number,
  usedIds: Set<string>,
  usedCovers: Set<string>,
): Listing[] {
  const out: Listing[] = [];

  const tryTake = (listing: Listing, allowRemap: boolean, allowReuse: boolean) => {
    if (out.length >= limit || usedIds.has(listing.id)) return;
    const candidates = coverCandidates(listing);
    const preferred = allowRemap
      ? candidates.find((url) => !usedCovers.has(coverKey(url)))
      : candidates[0] && !usedCovers.has(coverKey(candidates[0]))
        ? candidates[0]
        : undefined;
    const cover = preferred ?? (allowReuse ? candidates[0] : undefined);
    if (!cover && !allowReuse) return;
    usedIds.add(listing.id);
    if (cover) {
      usedCovers.add(coverKey(cover));
      out.push(withCover(listing, cover));
      return;
    }
    out.push(listing);
  };

  for (const listing of listings) {
    tryTake(listing, false, false);
    if (out.length >= limit) return out;
  }
  for (const listing of listings) {
    tryTake(listing, true, false);
    if (out.length >= limit) return out;
  }
  // Last resort: keep real ads even when every cover collides — never empty
  // the homepage while /search and /categories still have cards.
  for (const listing of listings) {
    tryTake(listing, true, true);
    if (out.length >= limit) return out;
  }

  return out;
}

function mostViewedSectionCopy(def: {
  categoryId: string;
  eyebrow: string;
  title: string;
  description: string;
  variant: "sand" | "white";
}) {
  return {
    ...def,
    eyebrow: "الأكثر مشاهدة",
    title: `الأكثر زيارة — ${def.eyebrow}`,
    description: `أعلى إعلانات ${def.eyebrow} مشاهدة حالياً — بدون تكرار مع المميزة أو القريبة منك.`,
  };
}

/**
 * Homepage composition (no duplicate listing ids across slices):
 * 1) Featured (paid package)
 * 2) Most-viewed rails per category
 * 3) Nearby / across Emirates
 */
async function buildHomeFeed(): Promise<HomeFeed> {
  const sectionDefs = mockHomeCategorySections.slice(0, HOME_SECTION_LIMIT);

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

  // Same eligibility as `/featured`, then spread category + emirate before covers.
  const activeFeatured = pickDiverseFeaturedListings(featuredRows, FEATURED_FETCH);

  // 1) Featured first — never backfill with non-featured catalog rows.
  const featured = takeDiverse(
    activeFeatured,
    FEATURED_SHOW,
    usedIds,
    usedCovers,
  );

  // 2) Most-visited per category (skips ids already used in featured).
  const sections = sectionDefs.map((section) => {
    const pool = sortByMostViewed(
      catalogRows.filter((listing) => listing.categoryId === section.categoryId),
    );
    const copy = mostViewedSectionCopy(section);
    return {
      ...copy,
      items: takeDiverse(pool, SECTION_SHOW, usedIds, usedCovers),
    };
  });

  // 3) Nearby last — remaining catalog, category-diverse covers.
  const nearbyPool = sortByMostViewed(
    catalogRows.filter((listing) => !usedIds.has(listing.id)),
  );
  const nearbySource = takeDiverse(
    nearbyPool,
    NEARBY_SHOW,
    usedIds,
    usedCovers,
  );

  return {
    catalogCount: catalogRows.length,
    featured,
    nearbySource,
    preview: [],
    sections,
  };
}

const getHomeFeedCached = unstable_cache(
  buildHomeFeed,
  ["sooqna-home-feed-v22-public-catalog-parity"],
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
