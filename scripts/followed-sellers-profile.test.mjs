import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("followed sellers profile surface", () => {
  it("exposes GET /api/follows and listFollowsByFollower", () => {
    const route = read("app/api/follows/route.ts");
    const store = read("services/follows/follow-store.ts");
    assert.match(route, /listFollowsByFollower/);
    assert.match(route, /export async function GET/);
    assert.match(store, /export async function listFollowsByFollower/);
  });

  it("profile hosts #following panel with FollowedSellersPanel", () => {
    const page = read("app/profile/page.tsx");
    assert.match(page, /id="following"/);
    assert.match(page, /FollowedSellersPanel/);
    assert.match(page, /البائعون الذين أتابعهم/);
  });

  it("dashboard nav links to /profile#following", () => {
    const shell = read("features/dashboard/components/DashboardShell.tsx");
    assert.match(shell, /\/profile#following/);
    assert.match(shell, /البائعون المتابعون/);
  });

  it("FollowSellerButton notifies profile on toggle", () => {
    const btn = read("features/listings/components/FollowSellerButton.tsx");
    assert.match(btn, /STORAGE_EVENTS\.followsChange/);
    assert.match(btn, /followsChange/);
  });

  it("EN phrases cover following section", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["البائعون الذين أتابعهم"], "Sellers I follow");
    assert.equal(phrases["البائعون المتابعون"], "Following");
    assert.equal(phrases["لا تتابع أي بائع بعد"], "You are not following any sellers yet");
  });
});
