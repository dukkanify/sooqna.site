import type { Listing } from "@/types";
import { PremiumListingCard } from "@/features/listings/components/PremiumListingCard";
import { MARKETPLACE_LISTING_GRID_CLASS } from "@/features/listings/components/listing-card.utils";
import { MarketSectionHeader, MarketSectionShell } from "./MarketSectionHeader";

type MarketFeaturedProps = {
  categories: { id: string; name: string }[];
  listings: Listing[];
};

export function MarketFeatured({ categories, listings }: MarketFeaturedProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const featured = listings.slice(0, 6);

  if (featured.length === 0) {
    return null;
  }

  return (
    <MarketSectionShell variant="white">
      <MarketSectionHeader
        actionHref="/featured"
        actionLabel="عرض جميع الإعلانات"
        description="إعلانات مختارة من سوقنا — صور حقيقية وأسعار واضحة من بائعين موثوقين."
        eyebrow="Featured"
        title="إعلانات مميزة"
      />

      <div className={MARKETPLACE_LISTING_GRID_CLASS}>
        {featured.map((listing) => (
          <PremiumListingCard
            key={listing.id}
            categoryName={categoryMap.get(listing.categoryId)}
            listing={listing}
          />
        ))}
      </div>
    </MarketSectionShell>
  );
}
