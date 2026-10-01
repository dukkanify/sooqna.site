/**
 * Admin AI Learning Assistant — knowledge answers + shell wiring.
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

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenMatches(hay, token) {
  if (!token || !hay) return false;
  if (hay.includes(token) || token.includes(hay)) return true;
  if (token.length >= 4 && hay.length >= 4 && token.slice(0, 4) === hay.slice(0, 4)) {
    return true;
  }
  return false;
}

/** Lightweight mirror of answerAdminAssistantQuery for CI without TS path aliases. */
function answerFromKnowledgeSource(message) {
  const src = read("services/admin/assistant-knowledge.ts");
  const blocks = [
    ...src.matchAll(
      /id:\s*"([^"]+)"[\s\S]*?keywords:\s*\[([\s\S]*?)\][\s\S]*?summary:\s*"((?:\\.|[^"\\])*)"/g,
    ),
  ];
  const articles = blocks.map((match) => ({
    id: match[1],
    keywords: [...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]),
    summary: match[3],
  }));
  const tokens = normalize(message)
    .split(" ")
    .filter((token) => token.length >= 2);
  if (!tokens.length) return { mode: "fallback", articleId: null };

  let best = null;
  for (const article of articles) {
    let score = 0;
    const keywordNorms = article.keywords.map((keyword) => normalize(keyword));
    for (const token of tokens) {
      if (keywordNorms.some((keyword) => tokenMatches(keyword, token))) score += 5;
    }
    if (article.id === "getting-started") score -= 1;
    if (!best || score > best.score) best = { article, score };
  }
  if (!best || best.score < 3) return { mode: "fallback", articleId: null };
  return { mode: "knowledge", articleId: best.article.id, summary: best.article.summary };
}

describe("admin AI learning assistant", () => {
  it("answers listing and escrow questions from knowledge", () => {
    const listings = answerFromKnowledgeSource("كيف أراجع إعلاناً جديداً؟");
    assert.equal(listings.mode, "knowledge");
    assert.equal(listings.articleId, "listings");
    assert.match(listings.summary, /الإعلانات|مراجعة|اعتمد|التمييز/);

    const escrow = answerFromKnowledgeSource("وين ألقى الضمان المالي؟");
    assert.equal(escrow.mode, "knowledge");
    assert.equal(escrow.articleId, "orders-escrow");

    const featured = answerFromKnowledgeSource("كيف أميّز إعلاناً مميّز؟");
    assert.equal(featured.mode, "knowledge");
    assert.equal(featured.articleId, "featured");
  });

  it("falls back politely on empty or unknown prompts", () => {
    const service = read("services/admin/assistant.service.ts");
    assert.match(service, /mode: "fallback"/);
    assert.match(service, /export function answerAdminAssistantQuery/);

    const empty = answerFromKnowledgeSource("   ");
    assert.equal(empty.mode, "fallback");

    const unknown = answerFromKnowledgeSource("xyzzy-not-a-desk-123");
    assert.equal(unknown.mode, "fallback");
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
