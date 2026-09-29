/**
 * Retire cars subcategory «قطع الغيار» without deleting listing data.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CARS_SUBCATEGORY_REMAP_TARGET,
  RETIRED_CAR_SUBCATEGORY_SPARE_PARTS,
  isRetiredSubcategory,
  remapRetiredListingSubcategory,
  stripRetiredSubcategories,
} from "../shared/constants/retired-subcategories.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("retire spare-parts subcategory", () => {
  it("strips قطع الغيار from cars selectable lists", () => {
    assert.equal(
      isRetiredSubcategory("cars", RETIRED_CAR_SUBCATEGORY_SPARE_PARTS),
      true,
    );
    assert.deepEqual(
      stripRetiredSubcategories("cars", [
        "سيارات مستعملة",
        "قطع غيار",
        "سيارات فاخرة",
      ]),
      ["سيارات مستعملة", "سيارات فاخرة"],
    );
  });

  it("remaps listing subcategory to used cars (keeps data)", () => {
    assert.equal(
      remapRetiredListingSubcategory("cars", "قطع غيار"),
      CARS_SUBCATEGORY_REMAP_TARGET,
    );
    assert.equal(
      remapRetiredListingSubcategory("cars", "سيارات فاخرة"),
      "سيارات فاخرة",
    );
  });

  it("mock seed and showcase no longer expose spare-parts sub", () => {
    const mock = read("mock/categories.mock.ts");
    assert.doesNotMatch(mock, /قطع غيار/);
    const showcase = read("services/listings/showcase-catalog.ts");
    assert.doesNotMatch(showcase, /subcategory:\s*"قطع غيار"/);
    assert.match(
      read("services/categories/category-store.ts"),
      /stripRetiredSubcategories/,
    );
  });
});
