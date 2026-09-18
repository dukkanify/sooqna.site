import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

describe("mobile menu in footer for guests", () => {
  it("MobileHomeHeader puts city by logo and drops search row", () => {
    const header = read("features/home/components/mobile/MobileHomeHeader.tsx");
    assert.doesNotMatch(header, /name=\{menuOpen \? "close" : "menu"\}/);
    assert.doesNotMatch(header, /setMenuOpen/);
    assert.doesNotMatch(header, /smart-row/);
    assert.doesNotMatch(header, /quick-search/);
    assert.match(header, /EmirateLocationSelect/);
    assert.match(header, /mobile-home-header__location--bar/);
    assert.match(header, /NotificationBell/);
    assert.doesNotMatch(header, /name="search"/);
  });

  it("MobileBottomNav opens guest menu; account for signed-in", () => {
    const nav = read("features/home/components/mobile/MobileBottomNav.tsx");
    assert.match(nav, /MobileGuestMenuDrawer/);
    assert.match(nav, /isAccount && !user/);
    assert.match(nav, /copy\.menu/);
    assert.match(nav, /href: "\/profile"/);
  });

  it("profile hosts app settings for signed-in users", () => {
    const page = read("app/profile/page.tsx");
    const panel = read("features/profile/components/ProfileAppSettings.tsx");
    assert.match(page, /ProfileAppSettings/);
    assert.match(panel, /id="app-settings"/);
    assert.match(panel, /LanguageSwitch/);
    assert.match(panel, /ThemeToggle/);
  });
});
