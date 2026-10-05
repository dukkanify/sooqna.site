import { MarketCatalogEmpty } from "@/features/home/components/marketplace/MarketCatalogEmpty";
import { MarketCategorySection } from "@/features/home/components/marketplace/MarketCategorySection";
import { MarketFeatured } from "@/features/home/components/marketplace/MarketFeatured";
import { MarketNearbySection } from "@/features/home/components/marketplace/MarketNearbySection";
import { DeferredHomeBelowFold } from "@/features/home/components/marketplace/DeferredHomeBelowFold";
import { resolveAppPreviewListings } from "@/features/home/components/mobile/mobile-app-preview.config";
import { getCategories } from "@/services/categories";
import { getHomeFeed } from "@/services/listings/home-feed";
import { Suspense } from "react";

/** Listing rails — fetched inside Suspense so the hero can paint first. */
export async function DesktopHomeFeed() {
  const [categories, feed] = await Promise.all([getCategories(), getHomeFeed()]);

  const categoryMeta = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const categoryById = (id: string) =>
    categories.find((c) => c.id === id)?.slug ?? id;

  const sectionListings = feed.sections.map((section) => ({
    categoryId: section.categoryId,
    categorySlug: categoryById(section.categoryId),
    description: section.description,
    eyebrow: section.eyebrow,
    listings: section.items,
    title: section.title,
    variant: section.variant,
  }));

  const appPreviewListings = resolveAppPreviewListings([
    ...feed.featured,
    ...feed.nearbySource,
    ...feed.sections.flatMap((section) => section.items),
  ]);

  const hasPublicListings = feed.catalogCount > 0;
  const aboveFoldSections = sectionListings.slice(0, 3);
  const belowFoldSections = sectionListings.slice(3);

  if (!hasPublicListings) {
    return <MarketCatalogEmpty />;
  }

  return (
    <>
      <MarketFeatured categories={categoryMeta} listings={feed.featured} />
      {aboveFoldSections.map((section) => (
        <MarketCategorySection
          key={section.categoryId}
          categoryId={section.categoryId}
          categorySlug={section.categorySlug}
          description={section.description}
          eyebrow={section.eyebrow}
          listings={section.listings}
          title={section.title}
          variant={section.variant}
        />
      ))}
      <MarketNearbySection listings={feed.nearbySource} />
      <Suspense fallback={null}>
        <DeferredHomeBelowFold
          appPreviewListings={appPreviewListings}
          sections={belowFoldSections}
        />
      </Suspense>
    </>
  );
}
