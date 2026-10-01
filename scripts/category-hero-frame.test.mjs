import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("category hero image frame", () => {
  it("uses a compact wide frame so section photos look good without dominating", () => {
    const hero = read("features/categories/components/CategoryHero.tsx");
    const css = read("features/categories/components/category-hero.css");
    assert.match(hero, /category-hero__media/);
    assert.match(hero, /category-hero\.css/);
    assert.doesNotMatch(hero, /min-h-\[7\.5rem\]/);
    assert.match(css, /aspect-ratio:\s*2\.7\s*\/\s*1/);
    assert.match(css, /max-height:\s*15rem/);
    assert.match(css, /object-fit:\s*cover\s*!important/);
    assert.match(css, /object-position:\s*center/);
    assert.match(css, /\.category-hero__media--compact/);
    // Avoid the oversized 16:9 / 2.4:1 desktop block.
    assert.doesNotMatch(css, /aspect-ratio:\s*16\s*\/\s*9/);
    assert.doesNotMatch(css, /aspect-ratio:\s*2\.4\s*\/\s*1/);
  });
});
