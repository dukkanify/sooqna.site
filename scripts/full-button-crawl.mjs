/**
 * Crawl live Sooqna pages and probe every visible button/link.
 *   BASE_URL=https://sooqnauae.com node scripts/full-button-crawl.mjs
 *
 * Writes /opt/cursor/artifacts/full-button-crawl-report.json
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { OPERATOR_ADMIN_EMAIL, OPERATOR_ADMIN_PASSWORD } from "../shared/constants/operator-admin.ts";

const BASE = (process.env.BASE_URL || "https://sooqnauae.com").replace(/\/$/, "");
const OUT = "/opt/cursor/artifacts/full-button-crawl-report.json";

const PAGES = [
  "/",
  "/search",
  "/categories",
  "/categories/cars",
  "/featured",
  "/escrow",
  "/help",
  "/about",
  "/contact",
  "/login",
  "/register",
  "/listings/new",
  "/profile",
  "/chat",
  "/notifications",
  "/orders",
  "/wallet",
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

const SKIP_BUTTON_TEXT =
  /حذف|رفض|إلغاء|logout|خروج|مسح|تعطيل|delete|reject|cancel|suspend/i;

const report = {
  base: BASE,
  startedAt: new Date().toISOString(),
  pages: [],
  buttons: [],
  bottomNav: [],
  adminDesks: [],
  failures: [],
};

function fail(scope, detail) {
  report.failures.push({ scope, detail });
  console.error("FAIL", scope, detail);
}

async function checkPage(page, path, bucket) {
  const entry = { path, status: 0, ok: false, error: null };
  try {
    const res = await page.goto(`${BASE}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    entry.status = res?.status() ?? 0;
    await page.waitForTimeout(600);
    const html = await page.content();
    if (entry.status >= 500) {
      entry.error = `HTTP ${entry.status}`;
      fail(path, entry.error);
    } else if (/Application error: a client-side exception/i.test(html)) {
      entry.error = "client exception";
      fail(path, entry.error);
    } else {
      entry.ok = true;
    }
  } catch (error) {
    entry.error = error instanceof Error ? error.message : String(error);
    fail(path, entry.error);
  }
  bucket.push(entry);
  return entry.ok;
}

async function probeControls(page, path) {
  const controls = await page.evaluate(() => {
    const nodes = [
      ...document.querySelectorAll("a[href], button, [role='button']"),
    ];
    return nodes.slice(0, 80).map((el, index) => {
      const href = el.getAttribute("href") || "";
      const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
      const disabled =
        el.hasAttribute("disabled") ||
        el.getAttribute("aria-disabled") === "true";
      const tag = el.tagName.toLowerCase();
      const type = el.getAttribute("type") || "";
      const rect = el.getBoundingClientRect();
      return {
        index,
        tag,
        href,
        text,
        disabled,
        type,
        visible: rect.width > 0 && rect.height > 0,
      };
    });
  });

  for (const control of controls) {
    if (!control.visible) continue;
    if (control.disabled) continue;
    if (SKIP_BUTTON_TEXT.test(control.text)) continue;

    const record = {
      path,
      ...control,
      result: "skipped",
    };

    try {
      if (control.tag === "a" && control.href) {
        if (
          control.href.startsWith("tel:") ||
          control.href.startsWith("mailto:") ||
          control.href.startsWith("http") && !control.href.includes("sooqna")
        ) {
          record.result = "external-ok";
          report.buttons.push(record);
          continue;
        }
        const abs = control.href.startsWith("http")
          ? control.href
          : new URL(control.href, BASE).toString();
        const res = await page.request.get(abs, { maxRedirects: 5 });
        const status = res.status();
        record.result = status < 500 ? "link-ok" : `link-${status}`;
        if (status >= 500) fail(`${path} → ${control.href}`, `HTTP ${status}`);
      } else if (control.tag === "button" || control.type === "button") {
        // Presence + enabled is enough for destructive/form submits.
        record.result = "button-present";
      } else {
        record.result = "present";
      }
    } catch (error) {
      record.result = "error";
      record.error = error instanceof Error ? error.message : String(error);
      fail(`${path} control`, record.error);
    }
    report.buttons.push(record);
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/usr/local/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    locale: "ar-AE",
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();

  for (const path of PAGES) {
    const ok = await checkPage(page, path, report.pages);
    if (ok) await probeControls(page, path);
  }

  // Mobile bottom nav — homepage chooses mobile shell via User-Agent.
  const mobile = await browser.newContext({
    locale: "ar-AE",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1500);
  const nav = mobilePage.locator(".mobile-bottom-nav a");
  const navCount = await nav.count();
  if (navCount === 0) {
    fail("bottom-nav", "not visible with mobile User-Agent");
  }
  for (let i = 0; i < navCount; i += 1) {
    const href = await nav.nth(i).getAttribute("href");
    const label = ((await nav.nth(i).innerText()) || "").trim();
    try {
      await nav.nth(i).click();
      await mobilePage.waitForTimeout(900);
      const url = mobilePage.url();
      const statusOk = !/Application error/i.test(await mobilePage.content());
      report.bottomNav.push({ href, label, url, ok: statusOk });
      if (!statusOk) fail(`bottom-nav ${label}`, url);
      await mobilePage.goto(`${BASE}/`);
      await mobilePage.waitForTimeout(500);
    } catch (error) {
      fail(
        `bottom-nav ${label}`,
        error instanceof Error ? error.message : String(error),
      );
      report.bottomNav.push({ href, label, ok: false });
    }
  }
  await mobile.close();

  // Admin login + desks
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(800);
  const toggle = page.getByRole("button", { name: /الدخول بكلمة المرور/i });
  if ((await toggle.count()) > 0) await toggle.first().click();
  await page.locator('input[name="email"]').fill(OPERATOR_ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(OPERATOR_ADMIN_PASSWORD);
  await page.getByRole("button", { name: /دخول غرفة التحكم|تسجيل الدخول/i }).first().click();
  await page.waitForTimeout(2500);
  await page.goto(`${BASE}/admin`);
  await page.waitForTimeout(1200);
  const adminOk = page.url().includes("/admin");
  if (!adminOk) {
    fail("admin-login", `landed on ${page.url()}`);
  } else {
    for (const desk of ADMIN_DESKS) {
      await checkPage(page, desk, report.adminDesks);
    }
  }

  report.finishedAt = new Date().toISOString();
  report.summary = {
    pageOk: report.pages.filter((p) => p.ok).length,
    pageTotal: report.pages.length,
    adminOk: report.adminDesks.filter((p) => p.ok).length,
    adminTotal: report.adminDesks.length,
    bottomNavOk: report.bottomNav.filter((p) => p.ok).length,
    bottomNavTotal: report.bottomNav.length,
    buttonProbes: report.buttons.length,
    failures: report.failures.length,
  };

  mkdirSync("/opt/cursor/artifacts", { recursive: true });
  writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  console.log("wrote", OUT);

  await browser.close();
  if (report.failures.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
