import type { Listing } from "@/types";
import { galleryForListingProduct } from "@/shared/constants/listing-product-media";

/** Inline data/blob URLs must never ship in SSR card payloads (multi‑MB HTML). */
export function isInlineListingImageUrl(url: string | undefined): boolean {
  const value = url?.trim().toLowerCase() ?? "";
  return value.startsWith("data:") || value.startsWith("blob:");
}

function remoteCoverImage(listing: Listing): string | undefined {
  for (const url of [...(listing.images ?? []), listing.imageUrl ?? ""]) {
    const trimmed = url?.trim();
    if (!trimmed || isInlineListingImageUrl(trimmed)) continue;
    return trimmed;
  }
  return undefined;
}

function coverImage(listing: Listing): string | undefined {
  const remote = remoteCoverImage(listing);
  if (remote) return remote;
  // Seller photos stored as data: URLs — use product gallery https covers for cards
  // so home/search HTML stays small. Detail pages can still resolve media separately.
  const generated = galleryForListingProduct({
    categoryId: listing.categoryId,
    count: 1,
    seed: `${listing.id}-card-cover`,
    title: listing.title,
    titleEnglish: listing.titleEnglish,
  });
  return generated[0]?.trim() || undefined;
}

/** Card-sized listing: bilingual titles, cover only, no descriptions/history.
 *  Keeps a tiny categorySpecs subset so cars cards can show year · mileage. */
export function slimListingForCard(listing: Listing): Listing {
  const cover = coverImage(listing);
  const slimSpecs = slimCategorySpecsForCard(listing);
  const avatarUrl = isInlineListingImageUrl(listing.seller.avatarUrl)
    ? undefined
    : listing.seller.avatarUrl;
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
      avatarUrl,
      isVerified: listing.seller.isVerified,
      sellerType: listing.seller.sellerType,
    },
    imageTone: listing.imageTone,
    titleEnglish: listing.titleEnglish,
    titleTranslationSource: listing.titleTranslationSource,
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
