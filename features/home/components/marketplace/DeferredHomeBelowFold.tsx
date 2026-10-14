import type { Listing } from "@/types";
import { MarketCategorySection } from "@/features/home/components/marketplace/MarketCategorySection";
import { MarketEmirates } from "@/features/home/components/marketplace/MarketEmirates";
import { MarketAppDownload } from "@/features/home/components/marketplace/MarketAppDownload";
import { MarketNearbySection } from "@/features/home/components/marketplace/MarketNearbySection";

type HomeSection = {
  categoryId: string;
  categorySlug: string;
  eyebrow: string;
  listings: Listing[];
  title: string;
  variant: "sand" | "white";
};

type DeferredHomeBelowFoldProps = {
  appPreviewListings: Listing[];
  nearbyListings: Listing[];
  sections: HomeSection[];
};

/**
 * Below-fold desktop rails. Order matches mobile home feed:
 * remaining category rails → Nearby → emirates → app download.
 */
export function DeferredHomeBelowFold({
  appPreviewListings,
  nearbyListings,
  sections,
}: DeferredHomeBelowFoldProps) {
  return (
    <>
      {sections.map((section) => (
        <MarketCategorySection
          key={section.categoryId}
          categoryId={section.categoryId}
          categorySlug={section.categorySlug}
          deferPaint
          listings={section.listings}
          title={section.title}
          variant={section.variant}
        />
      ))}
      <MarketNearbySection listings={nearbyListings} />
      <MarketEmirates />
      <MarketAppDownload previewListings={appPreviewListings} />
    </>
  );
}
