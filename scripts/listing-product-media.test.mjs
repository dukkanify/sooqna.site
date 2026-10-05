/**
 * Product media matching: car model tokens (M3, NX, …) must not steal
 * electronics titles. Bose/MacBook/Dell/HP get product-kind photos.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(
  path.join(root, "shared/constants/listing-product-media.ts"),
  "utf8",
);

describe("listing product media matching", () => {
  it("scopes car brand/model hints to the cars category", () => {
    assert.match(src, /const CAR_ONLY = "cars"/);
    assert.match(src, /kind: "bmw"[\s\S]{0,80}categoryId: CAR_ONLY/);
    assert.match(src, /kind: "lexus_suv"[\s\S]{0,80}categoryId: CAR_ONLY/);
    assert.match(src, /detectProductKind\(text, categoryId\)/);
    // MacBook Pro M3 would otherwise match the BMW `m3` token.
    assert.match(src, /\\b\(bmw\|[\s\S]*\|m3\|m5\)\\b/);
  });

  it("has electronics product kinds for soundbar, monitor, printer, laptop", () => {
    assert.match(src, /kind: "soundbar"/);
    assert.match(src, /kind: "monitor"/);
    assert.match(src, /kind: "printer"/);
    assert.match(src, /macbook\|laptop/);
    assert.match(src, /ساوند\\s\*بار/);
    assert.match(src, /ultrasharp/);
    assert.match(src, /طابعة/);
  });

  it("documents that MacBook M3 matches the BMW m3 token without a category gate", () => {
    const bmw = /\b(bmw|بي\s*ام\s*دبليو|بي ام|x5|x7|x3|m3|m5)\b/i;
    assert.equal(bmw.test("MacBook Pro M3 14-inch"), true);
    assert.equal(bmw.test("BMW M3 Competition"), true);
  });

  it("scopes job-role photo pools to the jobs category", () => {
    assert.match(src, /const JOBS_ONLY = "jobs"/);
    assert.match(src, /kind: "job_hotel"[\s\S]{0,80}categoryId: JOBS_ONLY/);
    assert.match(src, /kind: "job_nurse"[\s\S]{0,80}categoryId: JOBS_ONLY/);
    assert.match(src, /kind: "job_delivery"[\s\S]{0,80}categoryId: JOBS_ONLY/);
    assert.match(src, /kind: "job_engineer"[\s\S]{0,80}categoryId: JOBS_ONLY/);
    assert.match(src, /kind: "job_sales"[\s\S]{0,80}categoryId: JOBS_ONLY/);
    assert.match(src, /const REAL_ESTATE_ONLY = "real-estate"/);
    assert.match(src, /kind: "office"[\s\S]{0,80}categoryId: REAL_ESTATE_ONLY/);
  });

  it("matches hotel and nurse titles independently of the generic jobs pool", () => {
    const hotel = /(?<!\p{L})(hotel|front\s*desk|reception|استقبال|فندق)(?!\p{L})/iu;
    const nurse = /(?<!\p{L})(nurse|clinic|hospital|ممرض|عيادة|مستشفى)(?!\p{L})/iu;
    const delivery = /(?<!\p{L})(delivery|driver|courier|سائق|توصيل)(?!\p{L})/iu;
    assert.equal(hotel.test("Hotel Front Desk Agent"), true);
    assert.equal(hotel.test("موظف استقبال فندقي"), true);
    assert.equal(hotel.test("Sales Executive — Full Time"), false);
    assert.equal(nurse.test("Clinic Nurse"), true);
    assert.equal(nurse.test("ممرض/ة عيادة خاصة"), true);
    assert.equal(delivery.test("Delivery Driver — Sharjah"), true);
    assert.equal(delivery.test("سائق توصيل — الشارقة"), true);
  });
});
