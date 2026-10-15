/**
 * Public catalog must hide “إعلان تجريبي …” titles without classifying them
 * as confirmed fixtures (admin can still review).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  isConfirmedFixtureListing,
  isKeyboardMashTitle,
  isPublicQaTitleListing,
  needsManualReviewListing,
} from "../services/listings/mock-catalog-policy.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("hide demo title ads from public catalog", () => {
  it("detects Arabic/English QA titles for public hide", () => {
    assert.equal(
      isPublicQaTitleListing({
        id: "admin-1",
        slug: "demo-car",
        title: "إعلان تجريبي 01 — سيارة صغيرة — غير متاح للبيع",
      }),
      true,
    );
    assert.equal(
      isPublicQaTitleListing({
        id: "admin-2",
        slug: "real-car",
        title: "تويوتا كامري 2020",
      }),
      false,
    );
    assert.equal(
      isPublicQaTitleListing({
        id: "x",
        slug: "y",
        titleEnglish: "Listing تجريبي 01 — car",
      }),
      true,
    );
    assert.equal(
      isPublicQaTitleListing({
        id: "admin-3",
        slug: "camry-real",
        title: "تويوتا كامري qa-audit-1791190915405",
      }),
      true,
    );
    assert.equal(
      isPublicQaTitleListing({
        id: "admin-4",
        slug: "camry-en",
        title: "Toyota Camry",
        titleEnglish: "Toyota Camry qa-audit-1791190915405 updated",
      }),
      true,
    );
  });

  it("treats qa-audit id/slug stamps as confirmed fixtures", () => {
    assert.equal(
      isConfirmedFixtureListing({
        id: "local-qa-audit-1791190915405-cars-ab12cd",
        slug: "local-qa-audit-1791190915405-cars-ab12cd-cars",
        title: "تويوتا كامري",
      }),
      true,
    );
  });

  it("keeps title-only demos as manual review, not confirmed fixtures", () => {
    const demo = {
      id: "admin-9001",
      slug: "used-sofa-dubai",
      title: "إعلان تجريبي",
    };
    assert.equal(isConfirmedFixtureListing(demo), false);
    assert.equal(needsManualReviewListing(demo), true);
    assert.equal(isPublicQaTitleListing(demo), true);
  });

  it("hard-hides the known production demo car by id/slug", () => {
    assert.equal(
      isConfirmedFixtureListing({
        id: "local-1790600982192",
        slug: "01-982192",
        title: "إعلان تجريبي 01 — سيارة صغيرة — غير متاح للبيع",
      }),
      true,
    );
  });

  it("hides keyboard-mash titles from the public catalog", () => {
    assert.equal(isKeyboardMashTitle("Gghhhhhh"), true);
    assert.equal(isKeyboardMashTitle("نتالبغتنزنت"), true);
    assert.equal(isKeyboardMashTitle("تويوتا كامري 2020"), false);
    assert.equal(isKeyboardMashTitle("لاندكروزر"), false);
    assert.equal(
      isPublicQaTitleListing({
        id: "local-1791391793620",
        slug: "gghhhhhh-793620",
        title: "Gghhhhhh",
      }),
      true,
    );
    assert.equal(
      isConfirmedFixtureListing({
        id: "local-1791391793620",
        slug: "gghhhhhh-793620",
      }),
      true,
    );
  });

  it("wires public SQL + memory filters into listing queries and detail", () => {
    const queries = read("services/listings/listing-queries.ts");
    assert.match(queries, /PUBLIC_QA_TITLE_SQL/);
    assert.match(queries, /isPublicQaTitleListing/);
    const details = read("services/listings/listings.service.ts");
    assert.match(details, /isPublicQaTitleListing/);
    const feed = read("services/listings/home-feed.ts");
    assert.match(feed, /sooqna-home-feed-v36-inline-repair/);
    const policy = read("services/listings/mock-catalog-policy.ts");
    assert.match(policy, /qa-audit/);
    assert.match(policy, /PUBLIC_QA_TITLE_SQL/);
    assert.match(policy, /FIXTURE_LISTING_SQL/);
    assert.match(policy, /isKeyboardMashTitle/);
    assert.match(policy, /gghhhhhh-793620/);
  });
});

