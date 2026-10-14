/**
 * Desktop and mobile home feeds must share the same rail order so a section
 * like «الأكثر زيارة — موبايلات» is not followed by different content.
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

describe("home feed desktop/mobile parity", () => {
  it("both feeds use the shared getHomeFeed() source", () => {
    const desktop = read(
      "features/home/components/marketplace/DesktopHomeFeed.tsx",
    );
    const mobile = read(
      "features/home/components/mobile/MobileHomeFeed.tsx",
    );
    assert.match(desktop, /getHomeFeed\(\)/);
    assert.match(mobile, /getHomeFeed\(\)/);
    assert.match(desktop, /feed\.featured/);
    assert.match(mobile, /feed\.featured/);
    assert.match(desktop, /feed\.sections/);
    assert.match(mobile, /feed\.sections/);
  });

  it("desktop keeps Nearby after all category rails (same as mobile)", () => {
    const desktop = read(
      "features/home/components/marketplace/DesktopHomeFeed.tsx",
    );
    const deferred = read(
      "features/home/components/marketplace/DeferredHomeBelowFold.tsx",
    );
    const mobile = read(
      "features/home/components/mobile/MobileHomeFeed.tsx",
    );

    // Desktop must not render Nearby in the main feed (only via deferred block).
    assert.doesNotMatch(desktop, /<MarketNearbySection/);
    assert.match(deferred, /<MarketNearbySection/);
    const sectionMap = deferred.indexOf("sections.map");
    const nearby = deferred.indexOf("<MarketNearbySection");
    assert.ok(sectionMap >= 0 && nearby > sectionMap);

    // Mobile: category rails then nearby (JSX, not the import).
    const mobileRails = mobile.indexOf("belowFoldSections.map");
    const mobileNearby = mobile.indexOf("<MobileNearbyRail");
    assert.ok(mobileRails >= 0 && mobileNearby > mobileRails);
  });

  it("desktop category headers stay title-only like mobile rails", () => {
    const section = read(
      "features/home/components/marketplace/MarketCategorySection.tsx",
    );
    assert.doesNotMatch(section, /eyebrow=\{eyebrow\}/);
    assert.match(section, /title=\{title\}/);
  });
});
