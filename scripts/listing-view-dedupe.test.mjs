/**
 * Listing view anti-inflation helpers.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  alreadyCountedForIp,
  hasListingViewCookie,
  listingViewCookieName,
  looksLikeAutomatedClient,
} from "../services/listings/listing-view-dedupe.ts";

describe("listing view dedupe", () => {
  it("builds a stable cookie name per listing", () => {
    const a = listingViewCookieName("local-123");
    const b = listingViewCookieName("local-123");
    const c = listingViewCookieName("local-456");
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.match(a, /^sooqna_lv_[a-f0-9]{16}$/);
  });

  it("detects an existing view cookie", () => {
    const name = listingViewCookieName("listing-1");
    assert.equal(hasListingViewCookie(`${name}=1; other=x`, "listing-1"), true);
    assert.equal(hasListingViewCookie("other=x", "listing-1"), false);
  });

  it("blocks repeat IP hits within the window", () => {
    const id = `listing-ip-${Date.now()}`;
    assert.equal(alreadyCountedForIp("1.2.3.4", id), false);
    assert.equal(alreadyCountedForIp("1.2.3.4", id), true);
    assert.equal(alreadyCountedForIp("9.9.9.9", id), false);
  });

  it("flags common automated user agents", () => {
    assert.equal(looksLikeAutomatedClient(null), true);
    assert.equal(looksLikeAutomatedClient("curl/8.0"), true);
    assert.equal(
      looksLikeAutomatedClient(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      ),
      false,
    );
  });
});
