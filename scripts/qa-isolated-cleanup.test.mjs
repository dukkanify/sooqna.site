import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  path.join(root, "services/admin/qa-isolated-cleanup.ts"),
  "utf8",
);

function quotedStringsAfter(marker) {
  const start = source.indexOf(marker);
  assert.ok(start >= 0, marker);
  const slice = source.slice(start, source.indexOf("] as const", start));
  return [...slice.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

test("allowlists are exact approved sizes", () => {
  const users = quotedStringsAfter("export const QA_USERS_TO_DELETE");
  const listings = quotedStringsAfter("export const QA_LISTINGS_TO_DELETE");
  const notifications = quotedStringsAfter(
    "export const QA_NOTIFICATIONS_TO_DELETE",
  );
  assert.equal(users.length, 51);
  assert.equal(new Set(users).size, 51);
  assert.equal(listings.length, 5);
  assert.equal(new Set(listings).size, 5);
  assert.equal(notifications.length, 32);
  assert.equal(new Set(notifications).size, 32);
});

test("allowlists never include blocked or protected records", () => {
  const users = new Set(quotedStringsAfter("export const QA_USERS_TO_DELETE"));
  const listings = new Set(
    quotedStringsAfter("export const QA_LISTINGS_TO_DELETE"),
  );
  const blockedUsers = quotedStringsAfter("export const BLOCKED_USER_IDS");
  const blockedListings = quotedStringsAfter("export const BLOCKED_LISTING_IDS");
  for (const id of blockedUsers) {
    assert.equal(users.has(id), false, id);
  }
  for (const id of blockedListings) {
    assert.equal(listings.has(id), false, id);
  }
  assert.equal(
    [...listings].some((id) => id.startsWith("showcase-")),
    false,
  );
  assert.equal(
    [...listings].some((id) => id.startsWith("live-mkt-")),
    false,
  );
  assert.equal([...listings].some((id) => id.startsWith("qa26-")), false);
});
