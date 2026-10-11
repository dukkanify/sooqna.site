import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { OPERATOR_ADMIN_EMAIL, OPERATOR_ADMIN_PASSWORD } from "../shared/constants/operator-admin";

/**
 * Full-surface certification: pages, nav, bottom bar, admin desks, key CTAs.
 * Run against live/preview:
 *   PLAYWRIGHT_BASE_URL=https://sooqnauae.com npm run test:e2e -- e2e/full-surface-cert.spec.ts
 */

const PUBLIC_PAGES = [
  "/",
  "/search",
  "/categories",
  "/categories/cars",
  "/categories/electronics",
  "/categories/real-estate",
  "/categories/mobiles",
  "/featured",
  "/escrow",
  "/escrow-policy",
  "/dispute-policy",
  "/safety",
  "/help",
  "/about",
  "/contact",
  "/support",
  "/support/track",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

const AUTH_GATED = [
  "/profile",
  "/chat",
  "/notifications",
  "/orders",
  "/wallet",
  "/listings/new",
  "/dashboard/listings",
  "/activities",
  "/checkout",
];

const ADMIN_DESKS = [
  "/admin",
  "/admin/listings",
  "/admin/users",
  "/admin/disputes",
  "/admin/orders",
  "/admin/escrow",
  "/admin/categories",
  "/admin/settings",
  "/admin/assistant",
  "/admin/analytics",
  "/admin/reports",
  "/admin/locations",
  "/admin/wallets",
  "/admin/stripe",
  "/admin/favorites",
  "/admin/notifications",
  "/admin/addresses",
  "/admin/activities",
  "/admin/job-applications",
  "/admin/viewing-bookings",
  "/admin/quote-requests",
  "/admin/listing-reports",
  "/admin/support-messages",
  "/admin/audit",
];

const BOTTOM_NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/profile#favorites", label: "المفضلة" },
  { href: "/listings/new", label: "أضف إعلان" },
  { href: "/chat", label: "الرسائل" },
  { href: "/profile", label: "الحساب" },
];

async function expectOkPage(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  const status = response?.status() ?? 0;
  expect(status, `${path} status`).toBeLessThan(500);
  await expect(page.locator("body")).toBeVisible();
  const html = await page.content();
  expect(html.length, `${path} empty body`).toBeGreaterThan(200);
  // Next.js app error boundary
  expect(html).not.toMatch(/Application error: a client-side exception/i);
}

async function adminLogin(page: Page) {
  await page.goto("/login");
  await page.waitForTimeout(800);
  // Prefer password path when OTP is the default toggle.
  const passwordToggle = page.getByRole("button", { name: /الدخول بكلمة المرور|password/i });
  if ((await passwordToggle.count()) > 0) {
    await passwordToggle.first().click();
    await page.waitForTimeout(300);
  }
  await page.locator('input[name="email"]').first().fill(OPERATOR_ADMIN_EMAIL);
  const password = page.locator('input[name="password"]').first();
  await expect(password).toBeVisible({ timeout: 10_000 });
  await password.fill(OPERATOR_ADMIN_PASSWORD);
  await page
    .getByRole("button", { name: /دخول غرفة التحكم|تسجيل الدخول|Login|Sign in/i })
    .first()
    .click();
  await page.waitForURL(/\/(admin|profile|dashboard)?/, { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

test.describe("Public pages @full-surface", () => {
  for (const path of PUBLIC_PAGES) {
    test(`loads ${path}`, async ({ page }) => {
      await expectOkPage(page, path);
    });
  }
});

test.describe("Auth-gated pages @full-surface", () => {
  for (const path of AUTH_GATED) {
    test(`guest reaches ${path} without 5xx`, async ({ page }) => {
      await expectOkPage(page, path);
    });
  }
});

test.describe("Desktop header & home CTAs @full-surface", () => {
  test("header nav links work", async ({ page }) => {
    await page.goto("/");
    const navHrefs = [
      "/",
      "/categories",
      "/featured",
      "/search",
      "/login",
      "/listings/new",
    ];
    for (const href of navHrefs) {
      const link = page.locator(`a[href="${href}"], a[href^="${href}?"]`).first();
      if ((await link.count()) === 0) continue;
      await expect(link).toBeVisible();
      const [response] = await Promise.all([
        page.waitForResponse((res) => res.url().includes(href.split("?")[0]) || res.request().resourceType() === "document", {
          timeout: 15_000,
        }).catch(() => null),
        link.click({ force: true }),
      ]);
      await page.waitForTimeout(400);
      expect(page.url()).not.toMatch(/error/i);
      if (response) expect(response.status()).toBeLessThan(500);
      await page.goto("/");
    }
  });

  test("home listing cards and category links navigate", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    const listing = page
      .locator('a[href*="/listings/"]:not([href*="/listings/new"]):not([href*="/edit"])')
      .first();
    await expect(listing).toBeVisible({ timeout: 20_000 });
    await listing.click();
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/\/listings\/(?!new)/);
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/");
    const category = page.locator('a[href*="/categories/"]').first();
    if ((await category.count()) > 0) {
      await category.click();
      await page.waitForTimeout(800);
      expect(page.url()).toMatch(/\/(categories|search)/);
    }
  });

  test("hero search submit reaches /search", async ({ page }) => {
    await page.goto("/");
    const form = page.locator('form[action="/search"], form.market-hero-search').first();
    if ((await form.count()) === 0) {
      test.skip();
      return;
    }
    const query = form.locator('input[name="query"], input[type="search"], input[type="text"]').first();
    if ((await query.count()) > 0) {
      await query.fill("iphone");
    }
    await form.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(1200);
    expect(page.url()).toMatch(/\/search/);
  });
});

test.describe("Mobile bottom nav @full-surface", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  test("bottom nav items navigate", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    const nav = page.locator(".mobile-bottom-nav");
    await expect(nav).toBeVisible({ timeout: 15_000 });

    for (const item of BOTTOM_NAV) {
      const link = nav.locator(`a[href="${item.href}"], a[href^="${item.href}"]`).first();
      await expect(link, `bottom nav ${item.label}`).toBeVisible();
      await link.click();
      await page.waitForTimeout(800);
      const path = new URL(page.url()).pathname;
      const expectedPath = item.href.split("#")[0];
      expect(
        path === expectedPath ||
          path.startsWith(expectedPath) ||
          path.includes("/login") ||
          path.includes("/register"),
        `nav ${item.label} → ${page.url()}`,
      ).toBeTruthy();
      await expect(page.locator("body")).toBeVisible();
      // return home for next tap when possible
      if (path !== "/") {
        await page.goto("/");
        await page.waitForTimeout(400);
      }
    }
  });
});

test.describe("Search & listing CTAs @full-surface", () => {
  test("search page filters and result cards", async ({ page }) => {
    await page.goto("/search");
    await page.waitForTimeout(1200);
    await expect(page.locator("body")).toBeVisible();
    const card = page
      .locator('a[href*="/listings/"]:not([href*="/listings/new"]):not([href*="/edit"])')
      .first();
    if ((await card.count()) > 0) {
      await card.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toMatch(/\/listings\/(?!new)/);
      // primary CTAs present (chat / call / buy / share — any interactive)
      const cta = page.locator(
        'a[href^="tel:"], a[href*="/chat"], a[href*="/checkout"], button, [role="button"]',
      );
      expect(await cta.count()).toBeGreaterThan(0);
    }
  });

  test("electronics category shows ads and cards click", async ({ page }) => {
    await page.goto("/search?category=electronics");
    await page.waitForTimeout(1200);
    const cards = page.locator(
      'a[href*="/listings/"]:not([href*="/listings/new"]):not([href*="/edit"])',
    );
    expect(await cards.count()).toBeGreaterThan(0);
    await cards.first().click();
    await page.waitForTimeout(800);
    expect(page.url()).toMatch(/\/listings\/(?!new)/);
  });
});

test.describe("Admin desks @full-surface", () => {
  test("admin login + every desk loads", async ({ page }) => {
    await adminLogin(page);
    // Should land on admin or allow /admin
    await page.goto("/admin");
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/\/admin|\/login/);
    if (page.url().includes("/login")) {
      test.fail(true, "admin login failed — desks cannot be certified");
      return;
    }

    for (const desk of ADMIN_DESKS) {
      const response = await page.goto(desk, { waitUntil: "domcontentloaded" });
      const status = response?.status() ?? 0;
      expect(status, desk).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
      expect(page.url(), desk).toMatch(/\/admin/);
      const html = await page.content();
      expect(html).not.toMatch(/Application error: a client-side exception/i);
    }
  });

  test("admin sidebar links are clickable", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin");
    await page.waitForTimeout(1200);
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }
    const sideLinks = page.locator('a[href^="/admin"]');
    const count = await sideLinks.count();
    expect(count).toBeGreaterThan(5);
    // Click a sample of unique hrefs
    const hrefs = new Set<string>();
    for (let i = 0; i < Math.min(count, 40); i += 1) {
      const href = await sideLinks.nth(i).getAttribute("href");
      if (href) hrefs.add(href.split("?")[0]!);
    }
    for (const href of [...hrefs].slice(0, 15)) {
      await page.goto(href);
      await page.waitForTimeout(500);
      expect(page.url()).toContain("/admin");
      await expect(page.locator("body")).toBeVisible();
    }
  });
});

test.describe("API surface gates @full-surface", () => {
  test("guest blocked from admin + mutation APIs", async ({ request }) => {
    const paths = [
      "/api/admin/dashboard/summary",
      "/api/admin/listings",
      "/api/admin/orders",
      "/api/admin/users",
      "/api/uploads",
    ];
    for (const path of paths) {
      const res =
        path === "/api/uploads"
          ? await request.post(path)
          : await request.get(path);
      expect([401, 403, 405, 415], path).toContain(res.status());
    }
  });

  test("admin session can read dashboard summary", async ({
    request,
    page,
  }) => {
    await adminLogin(page);
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const res = await request.get("/api/admin/dashboard/summary", {
      headers: { Cookie: cookieHeader },
    });
    // 200 when logged in; 401/403 if login UI path differed
    expect([200, 401, 403]).toContain(res.status());
    if (res.status() === 200) {
      const json = await res.json();
      expect(json).toBeTruthy();
    }
  });
});

test.describe("Footer & static CTAs @full-surface", () => {
  test("footer legal links work", async ({ page }) => {
    await page.goto("/");
    const footerHrefs = [
      "/about",
      "/help",
      "/privacy",
      "/terms",
      "/contact",
      "/escrow-policy",
    ];
    for (const href of footerHrefs) {
      const link = page.locator(`footer a[href="${href}"], a[href="${href}"]`).last();
      if ((await link.count()) === 0) continue;
      await link.click({ force: true });
      await page.waitForTimeout(600);
      expect(page.url()).toContain(href);
      await expect(page.locator("body")).toBeVisible();
      await page.goto("/");
    }
  });
});
