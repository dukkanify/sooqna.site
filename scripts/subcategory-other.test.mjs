/**
 * Add-listing «أخرى» subcategory escape hatch.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OTHER_OPTION_VALUE,
  resolveListingSubcategory,
  subcategoryOptionsWithOther,
} from "../features/listings/components/add-listing/subcategory-other.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("subcategory Other option", () => {
  it("appends أخرى once and resolves free text onto listing.subcategory", () => {
    const options = subcategoryOptionsWithOther(["مبيعات", "تصميم", "أخرى"]);
    assert.deepEqual(
      options.map((o) => o.value),
      ["مبيعات", "تصميم", OTHER_OPTION_VALUE],
    );
    assert.equal(
      resolveListingSubcategory("أخرى", "معدات ثقيلة"),
      "معدات ثقيلة",
    );
    assert.equal(resolveListingSubcategory("أخرى", "أ"), undefined);
    assert.equal(resolveListingSubcategory("مبيعات", ""), "مبيعات");
  });

  it("CategorySelectionStep + submit path wire Other free text", () => {
    const step = read(
      "features/listings/components/add-listing/CategorySelectionStep.tsx",
    );
    assert.match(step, /subcategoryOptionsWithOther/);
    assert.match(step, /subcategoryOther/);
    assert.match(step, /صف القسم الفرعي/);
    const form = read(
      "features/listings/components/add-listing/useAddListingForm.ts",
    );
    assert.match(form, /resolveListingSubcategory/);
    assert.match(form, /SUBCATEGORY_OTHER_ERROR_AR/);
    assert.match(form, /fieldKey:\s*"subcategory"/);
  });
});
