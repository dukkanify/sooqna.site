/**
 * Desktop category nav — lg-only menu, narrow grouped dropdown, dual headers.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  groupCategorySubcategories,
  toDesktopCategoryNavItems,
} from "../shared/navigation/desktop-category-nav.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("desktop category navigation", () => {
  it("serializes durable categories into client-safe nav items with branch hrefs", () => {
    const items = toDesktopCategoryNavItems([
      {
        id: "cars",
        name: "سيارات ومركبات",
        slug: "cars",
        icon: "car",
        listingCount: 10,
        subcategories: ["سيارات مستعملة", "سيارات كهربائية"],
      },
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0].href, "/categories/cars");
    assert.equal(
      items[0].subcategories[0].href,
      "/categories/cars?subcategory=%D8%B3%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA%20%D9%85%D8%B3%D8%AA%D8%B9%D9%85%D9%84%D8%A9",
    );
    assert.equal(items[0].subcategories[1].name, "سيارات كهربائية");
    assert.equal(items[0].groups.length, 1);
    assert.equal(items[0].groups[0].title, "سيارات ومركبات");
  });

  it("groups rent/sale facets from real subcategory labels only", () => {
    const groups = groupCategorySubcategories("عقارات", [
      { name: "شقق للبيع", href: "/categories/real-estate?subcategory=a" },
      { name: "شقق للإيجار", href: "/categories/real-estate?subcategory=b" },
      { name: "مكاتب", href: "/categories/real-estate?subcategory=c" },
    ]);
    assert.equal(groups.length, 3);
    assert.equal(groups[0].title, "عقارات للبيع");
    assert.equal(groups[1].title, "عقارات للإيجار");
    assert.equal(groups[2].items[0].name, "مكاتب");
  });

  it("keeps the menu desktop-only and wires both storefront headers", () => {
    const menu = read("features/navigation/desktop/DesktopCategoryMenu.tsx");
    const css = read("features/navigation/desktop/desktop-category-menu.css");
    const nav = read("features/navigation/desktop/DesktopCategoryNav.tsx");
    const chrome = read("shared/layouts/SiteChrome.tsx");
    const home = read("app/page.tsx");
    const market = read("features/home/components/marketplace/MarketHeader.tsx");
    const site = read("shared/layouts/SiteHeader.tsx");
    const utility = read("features/navigation/desktop/DesktopUtilityNav.tsx");
    const mobileHeader = read(
      "features/home/components/mobile/MobileHomeHeader.tsx",
    );
    const bottomNav = read(
      "features/home/components/mobile/MobileBottomNav.tsx",
    );

    assert.match(menu, /min-width: 1024px/);
    assert.match(css, /@media \(min-width: 1024px\)/);
    assert.match(css, /rgb\(0 0 0 \/ 48%\)/);
    assert.match(css, /desktop-category-nav__group-title/);
    assert.match(nav, /getCategories/);
    assert.match(nav, /toDesktopCategoryNavItems/);
    assert.match(chrome, /<SiteHeader \/>/);
    assert.match(chrome, /<DesktopCategoryNav \/>/);
    assert.match(chrome, /desktop-storefront-sticky/);
    assert.match(home, /<DesktopCategoryNav \/>/);
    assert.match(home, /<MarketHeader \/>/);
    assert.match(market, /DesktopUtilityNav/);
    assert.match(site, /DesktopUtilityNav/);
    assert.match(utility, /\/profile#favorites/);
    assert.match(utility, /\/chat/);
    assert.match(utility, /\/dashboard\/listings/);
    assert.doesNotMatch(mobileHeader, /DesktopCategory/);
    assert.doesNotMatch(bottomNav, /DesktopCategory/);
    assert.equal(
      existsSync(
        path.join(root, "features/home/components/mobile/MobileHomeHeader.tsx"),
      ),
      true,
    );
  });

  it("does not import category-store into the client menu", () => {
    const menu = read("features/navigation/desktop/DesktopCategoryMenu.tsx");
    assert.doesNotMatch(menu, /category-store/);
    assert.doesNotMatch(menu, /getCategories/);
    assert.match(menu, /DesktopCategoryNavItem/);
  });
});
