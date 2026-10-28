import {
  MarketCategoryGrid,
  MarketHeader,
  MarketHero,
  MarketPromoBanner,
} from "@/features/home";
import { DesktopHomeFeed } from "@/features/home/components/marketplace/DesktopHomeFeed";
import { HomeFeedSkeleton } from "@/features/home/components/marketplace/HomeFeedSkeleton";
import {
  MobileCategoryGrid,
  MobileEmiratesSection,
  MobileHeroBlock,
  MobileHomeHeader,
  MobileHomeShell,
  MobilePromoBanner,
} from "@/features/home/components/mobile";
import { MobileHomeFeed } from "@/features/home/components/mobile/MobileHomeFeed";
import { DesktopCategoryNav } from "@/features/navigation/desktop/DesktopCategoryNav";
import { SiteFooter } from "@/shared/layouts/SiteFooter";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { getCategories } from "@/services/categories";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { Suspense } from "react";

export default async function Home() {
  const ua = userAgent({ headers: await headers() });
  const preferMobile =
    ua.device.type === "mobile" || ua.device.type === "tablet";

  const categories = await getCategories();
  const categoryById = (id: string) =>
    categories.find((c) => c.id === id)?.slug ?? id;

  if (preferMobile) {
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
              <Suspense fallback={<HomeFeedSkeleton />}>
                <MobileHomeFeed categoryById={categoryById} />
              </Suspense>
            </main>
          </LocalizedTree>
        </MobileHomeShell>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <div className="desktop-storefront-sticky sticky top-0 z-50 bg-surface">
        <MarketHeader />
        <DesktopCategoryNav />
      </div>
      <LocalizedTree>
        <main>
          <MarketHero categories={categories} />
          <MarketCategoryGrid categories={categories} />
          <MarketPromoBanner />
          <Suspense fallback={<HomeFeedSkeleton />}>
            <DesktopHomeFeed />
          </Suspense>
        </main>
      </LocalizedTree>
      <SiteFooter />
    </>
  );
}
