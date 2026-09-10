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

test("showcase catalog is demo-marked and covers all 13 mock categories", () => {
  const src = readFileSync(
    path.join(root, "services/listings/showcase-catalog.ts"),
    "utf8",
  );
  const policy = readFileSync(
    path.join(root, "shared/listings/showcase-listing.ts"),
    "utf8",
  );
  const categories = [
    "cars",
    "real-estate",
    "electronics",
    "mobiles",
    "furniture",
    "jobs",
    "fashion",
    "services",
    "pets",
    "kids",
    "books",
    "sports",
    "food",
  ];
  for (const id of categories) {
    assert.match(src, new RegExp(`categoryId: "${id}"`));
  }
  assert.match(src, /isDemo: true/);
  assert.match(src, /SHOWCASE_SOURCE/);
  assert.match(src, /SHOWCASE_SELLER_ID/);
  assert.match(policy, /SOOQNA_SHOWCASE/);
  assert.match(policy, /seller-sooqna-showcase/);
  assert.doesNotMatch(src, /listing-car-001/);
  assert.doesNotMatch(src, /qa26-/);
  assert.doesNotMatch(src, /e2e-preview-/);
  assert.doesNotMatch(src, /slug: "office-business-bay"/);
});

test("showcase ids and slugs are never confirmed fixtures", () => {
  assert.equal(
    isConfirmedFixtureListing({
      id: "showcase-cars-01",
      slug: "showcase-toyota-land-cruiser-2022",
      title: "تويوتا لاند كروزر 2022 — معرض تجريبي",
      seller: { name: "سوقنا — معرض تجريبي" },
    }),
    false,
  );
  assert.equal(
    isConfirmedFixtureListing({
      id: "showcase-real-estate-08",
      slug: "showcase-office-business-bay-showcase",
    }),
    false,
  );
});

test("public listing queries rank showcase after real listings", () => {
  const src = readFileSync(
    path.join(root, "services/listings/listing-queries.ts"),
    "utf8",
  );
  assert.match(src, /SHOWCASE_SOURCE/);
  assert.match(src, /ensureShowcaseCatalogPublished/);
});

test("category CTAs are centralized and job seeker is not apply-job", () => {
  const src = readFileSync(
    path.join(root, "shared/constants/listingActionConfig.ts"),
    "utf8",
  );
  assert.match(src, /getJobListingKind/);
  assert.match(src, /تقديم على الوظيفة/);
  assert.match(src, /استفسر عن العقار/);
  assert.match(src, /طلب عرض سعر/);
  assert.match(src, /تواصل مع البائع/);
  assert.match(src, /تواصل مع الباحث عن عمل/);
  assert.match(src, /listingType === "seeker"/);
  const jobsApi = readFileSync(
    path.join(root, "app/api/job-applications/route.ts"),
    "utf8",
  );
  assert.match(jobsApi, /listingType === "seeker"/);
  const contact = readFileSync(
    path.join(root, "shared/listings/listing-contact.ts"),
    "utf8",
  );
  assert.doesNotMatch(contact, /971500000001/);
  const purchase = readFileSync(
    path.join(root, "shared/listings/purchase-eligibility.ts"),
    "utf8",
  );
  assert.match(purchase, /isPurchasableListing/);
  assert.match(purchase, /isCheckoutOperational/);
  assert.match(purchase, /NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/);
  const actions = readFileSync(
    path.join(root, "shared/constants/listingActionConfig.ts"),
    "utf8",
  );
  assert.match(actions, /isPurchasableListing/);
  assert.match(
    actions,
    /categoryId === "cars"\) \{\s*return contactConfig\("CONTACT_SELLER"\);/,
  );
  const primary = readFileSync(
    path.join(root, "features/listings/components/ListingPrimaryAction.tsx"),
    "utf8",
  );
  assert.match(primary, /إظهار رقم الهاتف/);
});

test("admin can hide or remove the showcase catalog without a code change", () => {
  const api = readFileSync(
    path.join(root, "app/api/admin/listings/showcase/route.ts"),
    "utf8",
  );
  assert.match(api, /publish/);
  assert.match(api, /hide/);
  assert.match(api, /remove/);
  const panel = readFileSync(
    path.join(root, "features/admin/components/AdminListingsPanel.tsx"),
    "utf8",
  );
  assert.match(panel, /\/api\/admin\/listings\/showcase/);
});
