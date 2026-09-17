import type { Listing } from "@/types";

function coverImage(listing: Listing): string | undefined {
  const gallery = listing.images?.find((url) => url?.trim());
  if (gallery) return gallery.trim();
  const cover = listing.imageUrl?.trim();
  return cover || undefined;
}

/** Card-sized listing: bilingual titles, cover only, no descriptions/history.
 *  Keeps a tiny categorySpecs subset so cars cards can show year · mileage. */
export function slimListingForCard(listing: Listing): Listing {
  const cover = coverImage(listing);
  const slimSpecs = slimCategorySpecsForCard(listing);
  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    description: "",
    categoryId: listing.categoryId,
    city: listing.city,
    country: listing.country,
    price: listing.price,
    currency: listing.currency,
    condition: listing.condition,
    status: listing.status,
    isFeatured: listing.isFeatured,
    views: listing.views,
    imageUrl: cover,
    seller: {
      id: listing.seller.id,
      name: listing.seller.name,
      nameEnglish: listing.seller.nameEnglish,
      avatarUrl: listing.seller.avatarUrl,
      isVerified: listing.seller.isVerified,
      sellerType: listing.seller.sellerType,
    },
    imageTone: listing.imageTone,
    titleEnglish: listing.titleEnglish,
    subcategory: listing.subcategory,
    emirate: listing.emirate,
    area: listing.area,
    images: cover ? [cover] : undefined,
    isPremium: listing.isPremium,
    escrowAvailable: listing.escrowAvailable,
    verifiedSeller: listing.verifiedSeller,
    postedAt: listing.postedAt,
    featuredUntil: listing.featuredUntil,
    isDemo: listing.isDemo,
    source: listing.source,
    ...(slimSpecs ? { categorySpecs: slimSpecs } : {}),
  };
}

const CARD_SPEC_KEYS = [
  "brand",
  "model",
  "year",
  "mileage",
  "transmission",
  "fuelType",
  "regionalSpecs",
] as const;

function slimCategorySpecsForCard(
  listing: Listing,
): Listing["categorySpecs"] | undefined {
  const specs = listing.categorySpecs;
  if (!specs || Object.keys(specs).length === 0) return undefined;
  const next: Record<string, string | number | boolean> = {};
  for (const key of CARD_SPEC_KEYS) {
    const value = specs[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      next[key] = value;
    }
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

/** Autocomplete docs need brand/model specs, not gallery/history blobs. */
export function slimListingForSuggest(listing: Listing): Listing {
  return {
    ...slimListingForCard(listing),
    categorySpecs: listing.categorySpecs,
    features: listing.features?.slice(0, 12),
  };
}
