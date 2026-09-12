"use client";

import type { Listing } from "@/types";
import { PremiumListingCard } from "@/features/listings/components/PremiumListingCard";
import { MARKETPLACE_LISTING_GRID_CLASS } from "@/features/listings/components/listing-card.utils";
import { getNearbyListings } from "@/features/home/components/mobile/mobile-home.config";
import { MarketSectionHeader, MarketSectionShell } from "./MarketSectionHeader";

type MarketNearbySectionProps = {
  listings: Listing[];
};

export function MarketNearbySection({ listings }: MarketNearbySectionProps) {
  const nearby = getNearbyListings(listings, 8);

  if (nearby.length === 0) return null;

  return (
    <MarketSectionShell variant="white">
      <MarketSectionHeader
        actionHref="/search"
        actionLabel="عرض الكل"
        description="إعلانات من مدن الإمارات — تصفّح وتواصل بسرعة."
        eyebrow="Nearby"
        title="القريبة منك"
      />

      <div className={MARKETPLACE_LISTING_GRID_CLASS}>
        {nearby.map(({ listing }) => (
          <PremiumListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </MarketSectionShell>
  );
}
