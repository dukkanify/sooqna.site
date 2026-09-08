import { MarketCatalogEmpty } from "@/features/home/components/marketplace/MarketCatalogEmpty";
import {
  MobileAppDownload,
  MobileCategoryGrid,
  MobileCategoryRail,
  MobileEmiratesSection,
  MobileFeaturedRail,
  MobileHeroBlock,
  MobileHomeHeader,
  MobileHomeShell,
  MobileNearbyRail,
  MobilePreviewStrip,
  MobilePromoBanner,
} from "@/features/home/components/mobile";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import type { Category, Listing } from "@/types";
import "./mobile-home.css";

type HomeSection = {
  categoryId: string;
  title: string;
  items: Listing[];
};

type MobileHomePageProps = {
  appPreviewListings: Listing[];
  categories: Category[];
  categoryById: (id: string) => string;
  featuredListings: Listing[];
  nearbyListings: Listing[];
  sectionListings: HomeSection[];
};

/** Isolated mobile homepage tree — keeps mobile-home.css off the desktop bundle. */
export function MobileHomePage({
  appPreviewListings,
  categories,
  categoryById,
  featuredListings,
  nearbyListings,
  sectionListings,
}: MobileHomePageProps) {
  return (
    <>
      <MobileHomeShell fullWidth>
        <MobileHomeHeader />
        <LocalizedTree>
          <main className="mobile-home-main">
            <MobileHeroBlock categories={categories} />
            <MobileCategoryGrid categories={categories} />
            <MobilePromoBanner />
            <MobileEmiratesSection />
            {featuredListings.length === 0 &&
            nearbyListings.length === 0 &&
            sectionListings.every((section) => section.items.length === 0) ? (
              <MarketCatalogEmpty />
            ) : (
              <>
                <MobilePreviewStrip listings={featuredListings} />
                <MobileFeaturedRail listings={featuredListings} />
                <MobileNearbyRail listings={nearbyListings} />
                {sectionListings.map((section) => (
                  <MobileCategoryRail
                    key={section.categoryId}
                    categorySlug={categoryById(section.categoryId)}
                    listings={section.items}
                    title={section.title}
                  />
                ))}
                <MobileAppDownload previewListings={appPreviewListings} />
              </>
            )}
          </main>
        </LocalizedTree>
      </MobileHomeShell>
      <SiteFooter />
    </>
  );
}
