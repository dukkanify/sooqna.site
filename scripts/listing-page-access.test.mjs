import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("pending listing owner preview", () => {
  it("resolves owner preview and login redirect instead of blind 404", () => {
    const access = read("shared/listings/listing-page-access.ts");
    assert.match(access, /export function resolveListingPageAccess/);
    assert.match(access, /login_required/);
    assert.match(access, /isPublicListingStatus/);
    assert.match(access, /listingNeedsOwnerStatusBanner/);
  });

  it("listing detail page uses access helper + owner banner", () => {
    const page = read("app/listings/[slug]/page.tsx");
    assert.match(page, /resolveListingPageAccess/);
    assert.match(page, /login\?next=/);
    assert.match(page, /showOwnerStatusBanner/);
    assert.match(page, /includeFixtures: true/);
  });

  it("local listing route shares the same access rules", () => {
    const page = read("app/listings/local/[id]/page.tsx");
    assert.match(page, /resolveListingPageAccess/);
    assert.match(page, /login\?next=/);
  });

  it("listing_received notification links to the listing preview URL", () => {
    const notify = read("services/listings/listing-notifications.ts");
    assert.match(
      notify,
      /href:\s*`\/listings\/\$\{listing\.slug\}`/,
    );
    assert.doesNotMatch(
      notify,
      /type:\s*"listing_received"[\s\S]*?href:\s*"\/dashboard\/listings"/,
    );
  });

  it("ships owner status banner on listing details", () => {
    const banner = read(
      "features/listings/components/ListingOwnerStatusBanner.tsx",
    );
    const view = read("features/listings/components/ListingDetailsView.tsx");
    assert.match(banner, /قيد المراجعة|listingStatusDescriptions/);
    assert.match(view, /ListingOwnerStatusBanner/);
    assert.match(view, /showOwnerStatusBanner/);
  });

  it("add-listing navigates to synced slug after submit", () => {
    const form = read(
      "features/listings/components/add-listing/useAddListingForm.ts",
    );
    assert.match(form, /synced\?\.slug/);
    assert.match(form, /router\.push\(`\/listings\/\$\{synced\.slug\}`\)/);
    assert.match(form, /saveLocalListing\(data\.listing\)/);
  });
});
