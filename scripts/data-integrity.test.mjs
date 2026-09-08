/**
 * Data-integrity guards — confirmed fixture listings must stay off the public catalog.
 * Keep patterns in sync with services/listings/mock-catalog-policy.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function isMockSeedListingId(id) {
  return (
    /^listing-(car|re|mob|elec|furn|svc|job|fashion|pets|kids|books|sports|food)-\d{3}$/.test(
      id,
    ) ||
    /^listing-extra-\d+$/.test(id) ||
    /^user-listing-\d{3}$/.test(id)
  );
}

const QA_SELLER_NAMES = new Set(["Preview E2E User", "QA26 User"]);

function isConfirmedFixtureListing(listing) {
  const id = listing.id?.trim() ?? "";
  const slug = listing.slug?.trim() || id;

  if (id && isMockSeedListingId(id)) return true;
  if (slug && isMockSeedListingId(slug)) return true;
  if (slug === "office-business-bay") return true;
  if (/^e2e-preview-[a-f0-9]+$/i.test(slug)) return true;
  if (/^e2e-[a-f0-9]{8}$/i.test(slug)) return true;
  if (/^qa26-[a-z]+-[a-f0-9]+$/i.test(slug)) return true;
  return false;
}

function needsManualReviewListing(listing) {
  if (isConfirmedFixtureListing(listing)) return false;
  const title = listing.title?.trim() ?? "";
  const sellerName = listing.seller?.name?.trim() ?? "";
  return (
    /^إعلان تجريبي\b/.test(title) ||
    /^E2E Preview Test Listing$/i.test(title) ||
    QA_SELLER_NAMES.has(sellerName)
  );
}

test("policy file still encodes fixture and no-seed-on-vercel rules", () => {
  const src = readFileSync(
    path.join(root, "services/listings/mock-catalog-policy.ts"),
    "utf8",
  );
  assert.match(src, /process\.env\.VERCEL/);
  assert.match(src, /ALLOW_MOCK_CATALOG/);
  assert.match(src, /office-business-bay/);
  assert.match(src, /qa26-\[a-z\]\+-\[a-f0-9\]\+/);
  assert.match(src, /needsManualReviewListing/);
  assert.match(src, /FIXTURE_LISTING_SQL/);
  assert.doesNotMatch(
    src,
    /OR COALESCE\(payload->>'title', ''\) LIKE 'إعلان تجريبي%'/,
  );
});

test("confirmed mock/QA listings are fixtures by id or slug only", () => {
  assert.equal(
    isConfirmedFixtureListing({ id: "listing-car-001", slug: "mercedes-amg-g63-2024" }),
    true,
  );
  assert.equal(
    isConfirmedFixtureListing({ id: "listing-re-004", slug: "office-business-bay" }),
    true,
  );
  assert.equal(
    isConfirmedFixtureListing({
      id: "local-1",
      slug: "e2e-preview-91d0c522",
      title: "إعلان تجريبي 91d0c522",
    }),
    true,
  );
  assert.equal(
    isConfirmedFixtureListing({
      id: "x",
      slug: "e2e-a53b6e42",
      title: "E2E Preview Test Listing",
    }),
    true,
  );
  assert.equal(
    isConfirmedFixtureListing({
      id: "x",
      slug: "qa26-car-be50a099",
      title: "Nissan Patrol كورنيش be50a099",
      seller: { name: "QA26 User" },
    }),
    true,
  );
});

test("title or seller name alone never marks a listing confirmed fake", () => {
  assert.equal(
    isConfirmedFixtureListing({
      id: "admin-9001",
      slug: "used-sofa-dubai",
      title: "إعلان تجريبي",
      seller: { name: "QA26 User" },
    }),
    false,
  );
  assert.equal(
    needsManualReviewListing({
      id: "admin-9001",
      slug: "used-sofa-dubai",
      title: "إعلان تجريبي",
      seller: { name: "QA26 User" },
    }),
    true,
  );
});

test("genuine-looking user listings are not auto-deleted as fixtures", () => {
  assert.equal(
    isConfirmedFixtureListing({
      id: "admin-171000",
      slug: "toyota-land-cruiser-dubai",
      title: "تويوتا لاند كروزر",
      seller: { name: "أحمد المنصوري" },
    }),
    false,
  );
  assert.equal(
    needsManualReviewListing({
      id: "admin-171000",
      slug: "toyota-land-cruiser-dubai",
      title: "تويوتا لاند كروزر",
      seller: { name: "أحمد المنصوري" },
    }),
    false,
  );
  assert.equal(
    isConfirmedFixtureListing({
      id: "local-9988",
      slug: "sofa-al-reem",
      title: "كنب للبيع",
    }),
    false,
  );
});

test("homepage no longer hardcodes the mock office listing", () => {
  const src = readFileSync(
    path.join(root, "services/content/homepage-marketplace.content.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /\/listings\/office-business-bay/);
  assert.doesNotMatch(src, /from "@\/mock\/catalog-metrics"/);
});

test("live marketplace counts are queried from the listing store, not mock seeds", () => {
  const src = readFileSync(
    path.join(root, "services/content/homepage-live-metrics.ts"),
    "utf8",
  );
  assert.match(src, /countActiveListingsByEmirate/);
  assert.match(src, /countActivePublicListings/);
});

test("emirate cards never fall back to a fake 500 count", () => {
  const src = readFileSync(
    path.join(root, "features/home/shared/uae-emirates.ts"),
    "utf8",
  );
  assert.doesNotMatch(src, /\?\? 500/);
});

test("sitemap and category directory do not hardcode listing slugs", () => {
  const sitemap = readFileSync(path.join(root, "app/sitemap.ts"), "utf8");
  assert.match(sitemap, /searchListings/);
  assert.doesNotMatch(sitemap, /getListings\(\)/);
  const directory = readFileSync(
    path.join(root, "features/categories/components/CategoryDirectory.tsx"),
    "utf8",
  );
  assert.doesNotMatch(directory, /featuredListingSlug/);
});
