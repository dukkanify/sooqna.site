import {
  MarketCatalogEmpty,
  MarketCategoryGrid,
  MarketCategorySection,
  MarketFeatured,
  MarketHeader,
  MarketHero,
  MarketNearbySection,
  MarketPromoBanner,
} from "@/features/home";
import { DeferredHomeBelowFold } from "@/features/home/components/marketplace/DeferredHomeBelowFold";
import { resolveAppPreviewListings } from "@/features/home/components/mobile/mobile-app-preview.config";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { getCategories } from "@/services/categories";
import { getHomeFeed } from "@/services/listings/home-feed";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { Suspense } from "react";

export default async function Home() {
  const ua = userAgent({ headers: await headers() });
  const preferMobile =
    ua.device.type === "mobile" || ua.device.type === "tablet";

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

  if (preferMobile) {
    const { MobileHomePage } = await import(
      "@/features/home/components/mobile/MobileHomePage"
    );
    return (
      <MobileHomePage
        appPreviewListings={appPreviewListings}
        categories={categories}
        categoryById={categoryById}
        featuredListings={feed.featured}
        nearbyListings={feed.nearbySource}
        sectionListings={feed.sections}
      />
    );
  }

  const hasPublicListings =
    feed.featured.length > 0 ||
    feed.nearbySource.length > 0 ||
    feed.sections.some((section) => section.items.length > 0);
  // Cars / real-estate / electronics (etc.) most-viewed rails above the fold.
  const aboveFoldSections = sectionListings.slice(0, 3);
  const belowFoldSections = sectionListings.slice(3);

  return (
    <>
      <MarketHeader />
      <LocalizedTree>
        <main>
          <MarketHero categories={categories} />
          <MarketCategoryGrid categories={categories} />
          <MarketPromoBanner />
          {hasPublicListings ? (
            <>
              {/* 1) Featured → 2) most-viewed by category → 3) nearby */}
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
          ) : (
            <MarketCatalogEmpty />
          )}
        </main>
      </LocalizedTree>
      <SiteFooter />
    </>
  );
}
