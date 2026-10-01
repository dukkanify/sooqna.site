/**
 * Admin AI Learning Assistant — knowledge answers + shell wiring.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("admin AI learning assistant", () => {
  it("answers listing and escrow questions from knowledge", async () => {
    const serviceUrl = pathToFileURL(
      path.join(root, "services/admin/assistant.service.ts"),
    ).href;
    const { answerAdminAssistantQuery } = await import(serviceUrl);

    const listings = answerAdminAssistantQuery("كيف أراجع إعلاناً جديداً؟");
    assert.equal(listings.mode, "knowledge");
    assert.equal(listings.articleId, "listings");
    assert.match(listings.answer, /الإعلانات|مراجعة|اعتمد/);
    assert.ok(listings.links.some((link) => link.href === "/admin/listings"));

    const escrow = answerAdminAssistantQuery("وين ألقى الضمان المالي؟");
    assert.equal(escrow.mode, "knowledge");
    assert.equal(escrow.articleId, "orders-escrow");
    assert.ok(escrow.links.some((link) => link.href === "/admin/escrow"));

    const featured = answerAdminAssistantQuery("كيف أميّز إعلاناً مميّز؟");
    assert.equal(featured.mode, "knowledge");
    assert.equal(featured.articleId, "featured");
  });

  it("falls back politely on empty or unknown prompts", async () => {
    const serviceUrl = pathToFileURL(
      path.join(root, "services/admin/assistant.service.ts"),
    ).href;
    const { answerAdminAssistantQuery } = await import(serviceUrl);

    const empty = answerAdminAssistantQuery("   ");
    assert.equal(empty.mode, "fallback");

    const unknown = answerAdminAssistantQuery("xyzzy-not-a-desk-123");
    assert.equal(unknown.mode, "fallback");
    assert.match(unknown.answer, /مطابقة|أوضح|اقتراح/);
  });

  it("wires page, API, shell nav, and FAB", () => {
    assert.match(read("app/admin/assistant/page.tsx"), /AdminAssistantPanel/);
    assert.match(read("app/admin/assistant/page.tsx"), /مساعد التعلّم/);

    const route = read("app/api/admin/assistant/route.ts");
    assert.match(route, /requireAdminUser/);
    assert.match(route, /answerAdminAssistantQuery/);

    const shell = read("features/admin/components/AdminShell.tsx");
    assert.match(shell, /\/admin\/assistant/);
    assert.match(shell, /مساعد التعلّم/);
    assert.match(shell, /AdminAssistantFab/);

    assert.match(
      read("features/admin/components/AdminAssistantFab.tsx"),
      /AdminAssistantPanel/,
    );
    assert.match(
      read("features/admin/components/admin-ops.css"),
      /\.admin-assistant-fab/,
    );
  });

  it("registers the test in package.json", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.match(pkg.scripts.test, /admin-ai-assistant\.test\.mjs/);
  });
});
