/**
 * Home speed — LCP priority, deferred heavy chunks, image paint.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("home speed / LCP", () => {
  it("promo banners do not steal LCP priority from the hero", () => {
    const desktop = read(
      "features/home/components/marketplace/MarketPromoBanner.tsx",
    );
    const mobile = read(
      "features/home/components/mobile/MobilePromoBanner.tsx",
    );
    assert.doesNotMatch(desktop, /\bpriority\b/);
    assert.doesNotMatch(mobile, /\bpriority\b/);
    assert.match(desktop, /loading="lazy"/);
    assert.match(mobile, /loading="lazy"/);
  });

  it("featured rails prioritize desktop LCP images only", () => {
    const desktop = read(
      "features/home/components/marketplace/MarketFeatured.tsx",
    );
    const mobile = read(
      "features/home/components/mobile/MobileFeaturedRail.tsx",
    );
    assert.match(desktop, /priority=\{index < 2\}/);
    // Mobile featured sits below cats/promo — never steal LCP from the hero.
    assert.doesNotMatch(mobile, /\bpriority=/);
  });

  it("nearby section is a server component (no use client)", () => {
    const src = read(
      "features/home/components/marketplace/MarketNearbySection.tsx",
    );
    assert.doesNotMatch(src, /^["']use client["']/m);
  });

  it("app phone mock is deferred with next/dynamic", () => {
    const deferred = read(
      "features/home/components/mobile/DeferredAppDevicePreview.tsx",
    );
    const desktop = read(
      "features/home/components/marketplace/MarketAppDownload.tsx",
    );
    const mobile = read(
      "features/home/components/mobile/MobileAppDownload.tsx",
    );
    assert.match(deferred, /next\/dynamic/);
    assert.match(deferred, /ssr:\s*false/);
    assert.match(desktop, /DeferredAppDevicePreview/);
    assert.match(mobile, /DeferredAppDevicePreview/);
    assert.doesNotMatch(desktop, /from "\.\/MobileAppDevicePreview"|from "@\/features\/home\/components\/mobile\/MobileAppDevicePreview"/);
  });

  it("push registrar is idle-deferred from root layout", () => {
    const layout = read("app/layout.tsx");
    const deferred = read(
      "shared/components/DeferredNotificationPushRegistrar.tsx",
    );
    assert.match(layout, /DeferredNotificationPushRegistrar/);
    assert.doesNotMatch(
      layout,
      /from "@\/features\/notifications\/NotificationPushRegistrar"/,
    );
    assert.match(deferred, /requestIdleCallback/);
  });

  it("listing media paints without opacity gate", () => {
    const src = read("shared/components/AppImage.tsx");
    assert.match(src, /paintImmediately/);
    assert.match(src, /!allowStockFallback/);
  });

  it("image optimizer allows S3 / R2 hosts", () => {
    const src = read("next.config.ts");
    assert.match(src, /\*\.amazonaws\.com/);
    assert.match(src, /\*\.r2\.dev/);
    assert.match(src, /S3_PUBLIC_BASE_URL/);
  });

  it("home streams listing rails after the hero", () => {
    const page = read("app/page.tsx");
    assert.match(page, /Suspense/);
    assert.match(page, /DesktopHomeFeed/);
    assert.match(page, /MobileHomeFeed/);
    assert.match(page, /HomeFeedSkeleton/);
    assert.doesNotMatch(page, /await getHomeFeed\(\)/);
  });

  it("EN localizer idle-batches mutation walks instead of sync full-body scans", () => {
    const src = read("shared/i18n/LiveLocalizer.tsx");
    assert.match(src, /applyRecords/);
    assert.match(src, /cancelIdleMutations = scheduleIdle/);
    assert.doesNotMatch(src, /characterData: true/);
  });

  it("hero pills keep the server ranking (no client reshuffle)", () => {
    const src = read(
      "features/home/components/marketplace/MarketHeroPills.tsx",
    );
    assert.doesNotMatch(src, /fetchPopularityScores/);
    assert.doesNotMatch(src, /sortByPopularity/);
  });

  it("touch devices skip card zoom and featured sheen", () => {
    const css = read("app/globals.css");
    assert.match(css, /\(hover: hover\) and \(pointer: fine\)/);
    const badge = read("features/listings/components/featured-badge.css");
    assert.match(badge, /\(hover: none\)/);
  });

  it("hero keeps a single static orb and skips LCP image filters", () => {
    const hero = read("features/home/components/marketplace/MarketHero.tsx");
    const css = read("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.match(hero, /market-hero__orb--gold/);
    assert.doesNotMatch(hero, /market-hero__orb--navy/);
    assert.doesNotMatch(hero, /market-hero__orb--mist/);
    const orb = css.match(/\.market-hero__orb\s*\{[^}]+\}/)?.[0] ?? "";
    assert.ok(orb);
    assert.doesNotMatch(orb, /filter\s*:/);
    assert.doesNotMatch(css, /market-hero-float/);
    const photoImg = css.match(/\.market-hero__photo img\s*\{[^}]+\}/)?.[0] ?? "";
    assert.doesNotMatch(photoImg, /filter\s*:/);
    const darkPhoto = css.match(
      /html\[data-theme="dark"\]\s*\.market-hero__photo\s*\{[^}]+\}/,
    )?.[0] ?? "";
    assert.doesNotMatch(darkPhoto, /filter\s*:/);
    const search = css.match(/\.market-hero-search\s*\{[^}]+\}/)?.[0] ?? "";
    assert.ok(search);
    assert.doesNotMatch(search, /backdrop-filter/);
    const pills = css.match(/\.market-hero-pill\s*\{[^}]+\}/)?.[0] ?? "";
    assert.ok(pills);
    assert.doesNotMatch(pills, /backdrop-filter/);
  });

  it("sticky chrome avoids backdrop-filter jank", () => {
    const desktop = read("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const header = desktop.match(/\.market-header\s*\{[^}]+\}/)?.[0];
    assert.ok(header);
    assert.doesNotMatch(header, /backdrop-filter/);

    const css = read("features/home/components/mobile/mobile-home.css").replace(
      /\/\*[\s\S]*?\*\//g,
      "",
    );
    const mobileHeader = css.match(/\.mobile-home-header\s*\{[^}]+\}/)?.[0];
    assert.ok(mobileHeader);
    assert.doesNotMatch(mobileHeader, /backdrop-filter/);
    const bottomNav = css.match(/\.mobile-bottom-nav\s*\{[^}]+\}/)?.[0];
    assert.ok(bottomNav);
    assert.doesNotMatch(bottomNav, /backdrop-filter/);
    const heroBg = css.match(/\.mobile-home-hero__bg img\s*\{[^}]+\}/)?.[0];
    assert.ok(heroBg);
    assert.doesNotMatch(heroBg, /filter\s*:/);
  });

  it("mobile home feed defers below-fold rails", () => {
    const src = read("features/home/components/mobile/MobileHomeFeed.tsx");
    assert.match(src, /market-rail--defer/);
    assert.match(src, /aboveFoldSections|slice\(0,\s*2\)/);
  });

  it("desktop nearby section uses content-visibility deferral", () => {
    const src = read(
      "features/home/components/marketplace/MarketNearbySection.tsx",
    );
    assert.match(src, /deferPaint/);
  });

  it("EN localizer prioritizes header chrome before idle main walk", () => {
    const src = read("shared/i18n/LiveLocalizer.tsx");
    assert.match(src, /requestIdleCallback|scheduleIdle/);
    assert.match(src, /querySelectorAll\("header, \[data-localize-critical\]"\)/);
    assert.match(src, /querySelector\("main"\)/);
  });

  it("marketplace locations fetch is idle-deferred", () => {
    const src = read("shared/hooks/useMarketplaceLocations.ts");
    assert.match(src, /requestIdleCallback/);
  });

  it("notification bell idle-defers the first unread fetch", () => {
    const src = read("features/notifications/NotificationBell.tsx");
    assert.match(src, /requestIdleCallback/);
  });

  it("mobile hero image quality stays modest for LCP", () => {
    const src = read("features/home/components/mobile/MobileHeroSection.tsx");
    assert.match(src, /quality=\{75\}/);
  });
});
