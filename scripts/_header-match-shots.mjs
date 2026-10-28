import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const out = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(out, { recursive: true });
const PREVIEW =
  "https://sooqna-git-cursor-des-bd1354-dukkanify-technology-llcs-projects.vercel.app/?_vercel_share=PLACEHOLDER";

const browser = await chromium.launch({ headless: true });

async function capture(shareUrl) {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 790 },
    locale: "ar-AE",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(90000);
  await page.goto(shareUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2800);

  const metrics = await page.evaluate(() => {
    const nav = document.querySelector(".desktop-category-nav");
    const util = document.querySelector(".desktop-utility-nav");
    return {
      hasNav: Boolean(nav),
      navDisplay: nav ? getComputedStyle(nav).display : null,
      utilItems: util?.querySelectorAll("a, .desktop-utility-nav__item").length ?? 0,
      cats: [...document.querySelectorAll(".desktop-category-nav__rail > button.desktop-category-nav__item")]
        .map((b) => b.textContent?.trim())
        .slice(0, 8),
      headerH: document.querySelector(".desktop-storefront-sticky")?.getBoundingClientRect().height,
    };
  });
  console.log("home", metrics);
  await page.screenshot({ path: path.join(out, "header-match-home-1600.png"), fullPage: false });

  // Open real-estate / عقارات
  const re = page.locator(".desktop-category-nav__rail button.desktop-category-nav__item", {
    hasText: "عقارات",
  });
  if (await re.count()) {
    await re.first().hover();
  } else {
    // second category usually real-estate
    await page.locator(".desktop-category-nav__rail button.desktop-category-nav__item").nth(1).hover();
  }
  await page.waitForTimeout(500);
  const open = await page.evaluate(() => ({
    overlay: document.querySelector(".desktop-category-nav__overlay")?.classList.contains("is-open"),
    panel: document.querySelector(".desktop-category-nav__panel")?.classList.contains("is-open"),
    panelW: document.querySelector(".desktop-category-nav__panel.is-open")?.getBoundingClientRect().width,
    panelH: document.querySelector(".desktop-category-nav__panel.is-open")?.getBoundingClientRect().height,
    groups: [...document.querySelectorAll(".desktop-category-nav__panel.is-open .desktop-category-nav__group-title")].map(
      (el) => el.textContent?.trim(),
    ),
    links: [...document.querySelectorAll(".desktop-category-nav__panel.is-open a.desktop-category-nav__link")].map(
      (el) => el.textContent?.trim(),
    ),
  }));
  console.log("dropdown", open);
  await page.screenshot({ path: path.join(out, "header-match-dropdown-1600.png"), fullPage: false });

  // category page SiteHeader
  await page.goto(shareUrl.replace("/?", "/categories/real-estate?"), {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(2200);
  await page.locator(".desktop-category-nav__rail button.desktop-category-nav__item", { hasText: "عقارات" }).first().hover();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, "header-match-siteheader-1600.png"), fullPage: false });

  // mobile regression
  await context.close();
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    locale: "ar-AE",
  });
  const mpage = await mobile.newPage();
  await mpage.goto(shareUrl, { waitUntil: "domcontentloaded" });
  await mpage.waitForTimeout(2500);
  const mm = await mpage.evaluate(() => ({
    hasDesktopNav: Boolean(document.querySelector(".desktop-category-nav")),
    display: document.querySelector(".desktop-category-nav")
      ? getComputedStyle(document.querySelector(".desktop-category-nav")).display
      : null,
    hasUtility: Boolean(document.querySelector(".desktop-utility-nav")),
  }));
  console.log("mobile", mm);
  await mpage.screenshot({ path: path.join(out, "header-match-mobile-390.png"), fullPage: false });
  await mobile.close();
}

const share = process.argv[2];
if (!share) throw new Error("share url required");
await capture(share);
await browser.close();
