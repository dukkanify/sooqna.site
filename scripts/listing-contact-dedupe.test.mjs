/**
 * Mobile listing detail must not repeat Buy/Contact channels mid-page —
 * those live only in the sticky bottom bar (desktop keeps the aside panel).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("listing contact channel dedupe", () => {
  it("does not revive the mid-page MobileListingPrimaryCtas stack", () => {
    assert.equal(
      existsSync(
        path.join(root, "features/listings/components/MobileListingPrimaryCtas.tsx"),
      ),
      false,
    );
    const details = read("features/listings/components/ListingDetailsView.tsx");
    assert.doesNotMatch(details, /MobileListingPrimaryCtas/);
    assert.doesNotMatch(details, /SellerContactActions/);
  });

  it("keeps a single mobile sticky contact bar and desktop aside panel", () => {
    const details = read("features/listings/components/ListingDetailsView.tsx");
    const sticky = read("features/listings/components/ListingStickyPanel.tsx");
    assert.match(details, /<MobileStickyActionBar/);
    assert.match(details, /<ListingStickyPanel/);
    assert.match(details, /className="hidden min-w-0 w-full max-w-full lg:col-start-2 lg:block"/);
    assert.match(sticky, /export function MobileStickyActionBar/);
    assert.match(sticky, /SellerContactActions/);
  });
});
