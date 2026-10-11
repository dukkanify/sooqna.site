/**
 * Guests must not hit /api/saved-searches (avoids console 401 on public search).
 * Run: node --test scripts/saved-searches-guest.test.mjs
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

describe("saved searches guest hydrate", () => {
  it("skips server hydrate without a session cookie", () => {
    for (const rel of [
      "features/search/components/SavedSearches.tsx",
      "features/profile/components/ProfileSavedSearches.tsx",
    ]) {
      const src = read(rel);
      assert.match(src, /hasBrowserSessionCookie/);
      assert.match(src, /if\s*\(\s*!hasBrowserSessionCookie\(\)\s*\)\s*return null/);
    }
  });

  it("shares the session cookie name with the server cookie helper", () => {
    assert.match(read("shared/auth/session-cookie-name.ts"), /sooqna_session/);
    assert.match(
      read("services/auth/session-cookie.ts"),
      /from "@\/shared\/auth\/session-cookie-name"/,
    );
  });
});
