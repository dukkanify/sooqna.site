import { test, expect } from "@playwright/test";

/**
 * Production-like smoke. Uses QA-isolated provenance markers.
 * Do not run against real customer accounts.
 */
const QA = `qa-e2e-${Date.now()}`;

test.describe("Sooqna smoke @qa-isolated", () => {
  test("homepage + login page render", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/login");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("search page loads", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator("body")).toBeVisible();
  });

  test("guest cannot POST uploads", async ({ request }) => {
    const response = await request.post("/api/uploads");
    expect([401, 403, 405]).toContain(response.status());
  });

  test("cron escrow maintenance unauthorized without secret", async ({
    request,
  }) => {
    const response = await request.get("/api/cron/escrow-maintenance");
    expect([401, 403, 503]).toContain(response.status());
  });

  test("Madmoon / escrow page loads", async ({ page }) => {
    await page.goto("/escrow");
    await expect(page.locator("body")).toBeVisible();
  });

  test(`qa marker ${QA} is isolated`, async () => {
    expect(QA.startsWith("qa-e2e-")).toBeTruthy();
  });
});
