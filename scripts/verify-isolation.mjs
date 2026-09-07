#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  ".vercel",
  "out",
  "dist",
  "coverage",
]);

const BLOCKED_NAME = /aviatorpass|aviator-pass|\baep\b/i;
const BLOCKED_CONTENT = /AviatorPass|aviatorpass/i;
const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".html",
  ".yml",
  ".yaml",
]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

const files = walk(ROOT);
const hits = [];

for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (rel === "scripts/verify-isolation.mjs") continue;
  if (BLOCKED_NAME.test(rel)) {
    hits.push(rel);
    continue;
  }
  if (!TEXT_EXT.has(path.extname(file))) continue;
  const text = readFileSync(file, "utf8");
  if (BLOCKED_CONTENT.test(text) && !rel.includes("SOOQNA_P0_PRE_CUTOVER")) {
    hits.push(rel);
  }
}

if (hits.length > 0) {
  console.error("isolation FAIL: AviatorPass traces found:");
  for (const hit of hits.slice(0, 50)) console.error(` - ${hit}`);
  process.exit(1);
}

console.log("isolation PASS: no AviatorPass files/config");
