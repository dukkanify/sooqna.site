/**
 * Contact Us → admin inbox + car year from≤to contract.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isYearRangeInverted,
  parseYearBound,
} from "../features/search/lib/year-range.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("support inbox persistence", () => {
  it("POST /api/support creates a stored message before email", () => {
    const src = read("app/api/support/route.ts");
    const createIdx = src.indexOf("await createSupportMessage");
    const emailIdx = src.indexOf("await deliverEmailSafely");
    assert.ok(createIdx > 0 && emailIdx > createIdx);
    assert.match(src, /adminPath:\s*"\/admin\/support-messages"/);
    assert.match(src, /type:\s*"support_message"/);
  });

  it("admin inbox route + panel + shell nav exist", () => {
    assert.match(
      read("app/admin/support-messages/page.tsx"),
      /AdminSupportMessagesPanel/,
    );
    assert.match(
      read("features/admin/components/AdminShell.tsx"),
      /\/admin\/support-messages/,
    );
    assert.match(
      read("app/api/admin/support-messages/route.ts"),
      /getAllSupportMessages/,
    );
    assert.match(
      read("services/support/support-message-store.ts"),
      /support-messages\.json/,
    );
  });
});

describe("car year range validation", () => {
  it("detects inverted from > to years", () => {
    assert.equal(isYearRangeInverted("2025", "2020"), true);
    assert.equal(isYearRangeInverted("2020", "2025"), false);
    assert.equal(isYearRangeInverted("2020", ""), false);
    assert.equal(parseYearBound("2018"), 2018);
  });

  it("CategorySmartFields filters max options by min year", () => {
    const src = read("features/search/components/CategorySmartFields.tsx");
    assert.match(src, /yearMaxOptions/);
    assert.match(src, /yearMinOptions/);
    assert.match(src, /YEAR_RANGE_ERROR_AR/);
    assert.match(src, /isYearRangeInverted/);
  });
});
