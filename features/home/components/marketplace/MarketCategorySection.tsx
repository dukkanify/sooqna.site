import type { Listing } from "@/types";
import { PremiumListingCard } from "@/features/listings/components/PremiumListingCard";
import { MARKETPLACE_LISTING_GRID_CLASS } from "@/features/listings/components/listing-card.utils";
import { MarketSectionHeader, MarketSectionShell } from "./MarketSectionHeader";

type MarketCategorySectionProps = {
  categoryId: string;
  categorySlug: string;
  deferPaint?: boolean;
  description: string;
  eyebrow: string;
  listings: Listing[];
  title: string;
  variant?: "sand" | "white";
};

export function MarketCategorySection({
  categorySlug,
  deferPaint = false,
  description,
  eyebrow,
  listings,
  title,
  variant = "sand",
}: MarketCategorySectionProps) {
  const items = listings;

  if (items.length === 0) {
    return null;
  }

  return (
    <MarketSectionShell deferPaint={deferPaint} variant={variant}>
      <MarketSectionHeader
        actionHref={`/categories/${categorySlug}`}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />

      <div className={MARKETPLACE_LISTING_GRID_CLASS}>
        {items.map((listing) => (
          <PremiumListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </MarketSectionShell>
  );
}
