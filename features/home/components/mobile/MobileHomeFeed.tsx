import { MarketCatalogEmpty } from "@/features/home/components/marketplace/MarketCatalogEmpty";
import { resolveAppPreviewListings } from "@/features/home/components/mobile/mobile-app-preview.config";
import { MobileAppDownload } from "@/features/home/components/mobile/MobileAppDownload";
import { MobileCategoryRail } from "@/features/home/components/mobile/MobileCategoryRail";
import { MobileFeaturedRail } from "@/features/home/components/mobile/MobileFeaturedRail";
import { MobileNearbyRail } from "@/features/home/components/mobile/MobileNearbyRail";
import { getHomeFeed } from "@/services/listings/home-feed";

type MobileHomeFeedProps = {
  categoryById: (id: string) => string;
};

/** Mobile listing rails — streamed after the hero so first paint is not blocked. */
export async function MobileHomeFeed({
  categoryById,
}: MobileHomeFeedProps) {
  const feed = await getHomeFeed();
  if (feed.catalogCount === 0) {
    return <MarketCatalogEmpty />;
  }

  const appPreviewListings = resolveAppPreviewListings([
    ...feed.featured,
    ...feed.nearbySource,
    ...feed.sections.flatMap((section) => section.items),
  ]);

  return (
    <>
      <MobileFeaturedRail listings={feed.featured} />
      {feed.sections.map((section) => (
        <MobileCategoryRail
          key={section.categoryId}
          categorySlug={categoryById(section.categoryId)}
          listings={section.items}
          title={section.title}
        />
      ))}
      <MobileNearbyRail listings={feed.nearbySource} />
      <MobileAppDownload previewListings={appPreviewListings} />
    </>
  );
}
