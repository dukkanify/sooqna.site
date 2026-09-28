import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergePopularityScores,
  popularityId,
  sortByPopularity,
  POPULARITY_SEEDS,
} from "../services/search/search-popularity.ts";

describe("mergePopularityScores", () => {
  it("keeps UAE seeds when there is no live usage", () => {
    const merged = mergePopularityScores({});
    assert.equal(merged["brand:toyota"], POPULARITY_SEEDS["brand:toyota"]);
    assert.equal(merged["category:cars"], POPULARITY_SEEDS["category:cars"]);
  });

  it("adds live hits on top of seeds instead of replacing them", () => {
    const merged = mergePopularityScores({ "brand:toyota": 1 });
    assert.equal(
      merged["brand:toyota"],
      POPULARITY_SEEDS["brand:toyota"] + 1,
      "first click must not demote a seeded brand below its baseline",
    );
  });

  it("ranks by seed + live so usage can overtake the baseline", () => {
    const brands = ["nissan", "toyota", "bmw"];
    const scores = mergePopularityScores({
      "brand:bmw": 50, // seed 110 + 50 = 160 > toyota 140
    });
    const ranked = sortByPopularity(brands, (b) => b, scores, "brand");
    assert.deepEqual(ranked, ["bmw", "toyota", "nissan"]);
  });

  it("builds stable popularity ids", () => {
    assert.equal(popularityId("city", "دبي"), "city:دبي");
    assert.equal(popularityId("brand", "Mercedes Benz"), "brand:mercedes-benz");
  });
});
