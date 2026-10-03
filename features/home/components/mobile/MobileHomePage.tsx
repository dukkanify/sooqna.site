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
  catalogCount: number;
  categories: Category[];
  categoryById: (id: string) => string;
  featuredListings: Listing[];
  nearbyListings: Listing[];
  sectionListings: HomeSection[];
};

/** Isolated mobile homepage — Featured → most-viewed categories → nearby. */
export function MobileHomePage({
  appPreviewListings,
  catalogCount,
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
            {catalogCount === 0 ? (
              <MarketCatalogEmpty />
            ) : (
              <>
                <MobileFeaturedRail listings={featuredListings} />
                {sectionListings.map((section) => (
                  <MobileCategoryRail
                    key={section.categoryId}
                    categorySlug={categoryById(section.categoryId)}
                    listings={section.items}
                    title={section.title}
                  />
                ))}
                <MobileNearbyRail listings={nearbyListings} />
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
