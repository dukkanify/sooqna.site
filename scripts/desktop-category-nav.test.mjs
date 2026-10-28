/**
 * Desktop category nav — lg-only menu, no mobile chrome edits, server-fed data.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { toDesktopCategoryNavItems } from "../shared/navigation/desktop-category-nav.ts";

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
    assert.equal(items[0].subcategories[0].href, "/categories/cars?subcategory=%D8%B3%D9%8A%D8%A7%D8%B1%D8%A7%D8%AA%20%D9%85%D8%B3%D8%AA%D8%B9%D9%85%D9%84%D8%A9");
    assert.equal(items[0].subcategories[1].name, "سيارات كهربائية");
  });

  it("keeps the menu desktop-only and wires both storefront headers", () => {
    const menu = read("features/navigation/desktop/DesktopCategoryMenu.tsx");
    const css = read("features/navigation/desktop/desktop-category-menu.css");
    const nav = read("features/navigation/desktop/DesktopCategoryNav.tsx");
    const chrome = read("shared/layouts/SiteChrome.tsx");
    const home = read("app/page.tsx");
    const mobileHeader = read(
      "features/home/components/mobile/MobileHomeHeader.tsx",
    );
    const bottomNav = read(
      "features/home/components/mobile/MobileBottomNav.tsx",
    );

    assert.match(menu, /min-width: 1024px/);
    assert.match(css, /@media \(min-width: 1024px\)/);
    assert.match(css, /rgb\(0 0 0 \/ 45%\)/);
    assert.match(nav, /getCategories/);
    assert.match(nav, /toDesktopCategoryNavItems/);
    assert.match(chrome, /<SiteHeader \/>/);
    assert.match(chrome, /<DesktopCategoryNav \/>/);
    assert.match(home, /<DesktopCategoryNav \/>/);
    assert.match(home, /<MarketHeader \/>/);
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
