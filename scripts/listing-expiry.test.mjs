import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  expireStaleListings,
  restorePrematurelyExpiredListings,
} from "../shared/listings/listing-expiry.ts";

const DAY = 24 * 60 * 60 * 1000;

function daysAgoIso(days) {
  return new Date(Date.now() - days * DAY).toISOString();
}

function daysFromNowIso(days) {
  return new Date(Date.now() + days * DAY).toISOString();
}

describe("listing expiry", () => {
  it("does not auto-expire live marketplace catalog seeds", () => {
    const listings = [
      {
        id: "live-mkt-018",
        source: "SOOQNA_LIVE_MARKETPLACE",
        status: "active",
        postedAt: daysAgoIso(60),
        expiresAt: daysFromNowIso(90),
        isFeatured: true,
        featuredUntil: daysFromNowIso(90),
      },
    ];
    const changed = expireStaleListings(listings, 30);
    assert.equal(changed, 0);
    assert.equal(listings[0].status, "active");
  });

  it("restores live catalog rows wrongly marked expired while expiresAt is open", () => {
    const listings = [
      {
        id: "live-mkt-018",
        source: "SOOQNA_LIVE_MARKETPLACE",
        status: "expired",
        postedAt: "2026-08-27T10:00:00+04:00",
        expiresAt: daysFromNowIso(60),
        isFeatured: true,
        featuredUntil: daysFromNowIso(60),
      },
    ];
    const restored = restorePrematurelyExpiredListings(listings);
    assert.equal(restored, 1);
    assert.equal(listings[0].status, "active");
  });

  it("does not expire an active featured listing mid-package", () => {
    const listings = [
      {
        id: "user-1",
        status: "active",
        postedAt: daysAgoIso(45),
        expiresAt: daysAgoIso(15),
        isFeatured: true,
        featuredUntil: daysFromNowIso(20),
      },
    ];
    const changed = expireStaleListings(listings, 30);
    assert.equal(changed, 0);
    assert.equal(listings[0].status, "active");
  });

  it("restores expired listings that still have an open featured window", () => {
    const listings = [
      {
        id: "user-2",
        status: "expired",
        postedAt: daysAgoIso(45),
        expiresAt: daysAgoIso(15),
        isFeatured: true,
        featuredUntil: daysFromNowIso(10),
      },
    ];
    const restored = restorePrematurelyExpiredListings(listings);
    assert.equal(restored, 1);
    assert.equal(listings[0].status, "active");
  });

  it("expires ordinary listings when expiresAt has passed", () => {
    const listings = [
      {
        id: "user-3",
        status: "active",
        postedAt: daysAgoIso(40),
        expiresAt: daysAgoIso(2),
      },
    ];
    const changed = expireStaleListings(listings, 30);
    assert.equal(changed, 1);
    assert.equal(listings[0].status, "expired");
  });

  it("falls back to postedAt + days when expiresAt is missing", () => {
    const listings = [
      {
        id: "user-4",
        status: "active",
        postedAt: daysAgoIso(40),
      },
    ];
    const changed = expireStaleListings(listings, 30);
    assert.equal(changed, 1);
    assert.equal(listings[0].status, "expired");
    assert.ok(listings[0].expiresAt);
  });

  it("keeps ordinary listings active when expiresAt is still in the future", () => {
    const listings = [
      {
        id: "user-5",
        status: "active",
        postedAt: daysAgoIso(40),
        expiresAt: daysFromNowIso(5),
      },
    ];
    const changed = expireStaleListings(listings, 30);
    assert.equal(changed, 0);
    assert.equal(listings[0].status, "active");
  });
});
