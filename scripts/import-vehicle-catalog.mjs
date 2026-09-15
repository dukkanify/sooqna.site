#!/usr/bin/env node
/**
 * Idempotent vehicle catalog import / validation.
 *
 * Usage:
 *   node scripts/import-vehicle-catalog.mjs
 *   node scripts/import-vehicle-catalog.mjs --dry-run
 *   node scripts/import-vehicle-catalog.mjs --regenerate
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "shared/vehicles/catalog.json");
const dryRun = process.argv.includes("--dry-run");
const regenerate = process.argv.includes("--regenerate");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (regenerate) {
  if (dryRun) {
    console.log("[dry-run] would regenerate shared/vehicles/catalog.json");
  } else {
    const result = spawnSync(
      process.execPath,
      [path.join(root, "scripts/data/generate-vehicle-catalog.mjs")],
      { cwd: root, stdio: "inherit" },
    );
    if (result.status !== 0) fail("generator failed");
  }
}

if (!existsSync(catalogPath)) fail(`missing ${catalogPath}`);

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const makes = catalog.makes ?? [];
const models = catalog.models ?? [];

const makeIds = new Set(makes.map((m) => m.id));
const makeSlugs = makes.map((m) => m.slug);
const dupMakeSlugs = makeSlugs.length - new Set(makeSlugs).size;
const modelKeys = models.map((m) => `${m.makeId}::${m.slug}`);
const dupModelKeys = modelKeys.length - new Set(modelKeys).size;
const orphanModels = models.filter((m) => !makeIds.has(m.makeId));
const inactiveMakes = makes.filter((m) => m.status !== "active");
const missingFields = makes.filter(
  (m) => !m.id || !m.slug || !m.nameEn || !m.nameAr,
);

const report = {
  dryRun,
  regenerate,
  makes: makes.length,
  models: models.length,
  activeMakes: makes.length - inactiveMakes.length,
  inactiveMakes: inactiveMakes.length,
  duplicateMakeSlugs: dupMakeSlugs,
  duplicateModelKeys: dupModelKeys,
  orphanModels: orphanModels.length,
  missingMakeFields: missingFields.length,
};

console.log(JSON.stringify(report, null, 2));

if (dupMakeSlugs > 0) fail("duplicate make slugs");
if (dupModelKeys > 0) fail("duplicate model keys");
if (orphanModels.length > 0) fail("orphan models");
if (missingFields.length > 0) fail("makes missing required fields");
if (makes.length < 80) fail("expected a comprehensive make catalog (>=80)");
if (models.length < 400) fail("expected comprehensive models (>=400)");

console.log("VEHICLE CATALOG IMPORT: PASS");
