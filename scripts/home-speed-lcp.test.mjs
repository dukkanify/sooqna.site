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

  it("featured rails prioritize the first listing images", () => {
    const desktop = read(
      "features/home/components/marketplace/MarketFeatured.tsx",
    );
    const mobile = read(
      "features/home/components/mobile/MobileFeaturedRail.tsx",
    );
    assert.match(desktop, /priority=\{index < 2\}/);
    assert.match(mobile, /priority=\{index === 0\}/);
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
});
