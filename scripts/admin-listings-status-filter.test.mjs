/**
 * /admin/listings?status=pending_review must show pending ads, not the
 * default marketplace mix.
 * Run: node --test --experimental-strip-types scripts/admin-listings-status-filter.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  listingMatchesAdminStatusFilter,
  parseAdminListingsStatusFilter,
} from "../features/admin/lib/listings-desk-filters.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("admin listings ?status= filter", () => {
  it("parses pending_review and pending alias; defaults to marketplace", () => {
    assert.equal(parseAdminListingsStatusFilter("pending_review"), "pending_review");
    assert.equal(parseAdminListingsStatusFilter("pending"), "pending_review");
    assert.equal(parseAdminListingsStatusFilter("active"), "active");
    assert.equal(parseAdminListingsStatusFilter("featured"), "featured");
    assert.equal(parseAdminListingsStatusFilter(null), "marketplace");
    assert.equal(parseAdminListingsStatusFilter(""), "marketplace");
    assert.equal(parseAdminListingsStatusFilter("nope"), "marketplace");
  });

  it("pending_review matches pending marketplace ads only", () => {
    assert.equal(
      listingMatchesAdminStatusFilter({
        featuredLive: false,
        isDemo: false,
        isMarketplace: true,
        status: "pending_review",
        statusFilter: "pending_review",
      }),
      true,
    );
    assert.equal(
      listingMatchesAdminStatusFilter({
        featuredLive: false,
        isDemo: false,
        isMarketplace: true,
        status: "active",
        statusFilter: "pending_review",
      }),
      false,
    );
    assert.equal(
      listingMatchesAdminStatusFilter({
        featuredLive: false,
        isDemo: true,
        isMarketplace: false,
        status: "pending_review",
        statusFilter: "pending_review",
      }),
      false,
    );
  });

  it("marketplace bucket is all real ads, not a stand-in for pending", () => {
    assert.equal(
      listingMatchesAdminStatusFilter({
        featuredLive: false,
        isDemo: false,
        isMarketplace: true,
        status: "active",
        statusFilter: "marketplace",
      }),
      true,
    );
    assert.equal(
      listingMatchesAdminStatusFilter({
        featuredLive: false,
        isDemo: false,
        isMarketplace: true,
        status: "pending_review",
        statusFilter: "marketplace",
      }),
      true,
    );
  });

  it("desk reads status from the URL and does not clobber inbound query", () => {
    const src = read("features/admin/components/AdminListingsPanel.tsx");
    assert.match(src, /parseAdminListingsStatusFilter\(searchParams\.get\("status"\)\)/);
    assert.doesNotMatch(
      src,
      /useState\(\s*\(\)\s*=>\s*searchParams\.get\("status"\)/,
    );
    assert.match(src, /params\.set\("status", nextStatus\)/);
    const dash = read("services/admin/admin-dashboard.service.ts");
    assert.match(dash, /\/admin\/listings\?status=pending_review/);
  });
});
