/**
 * Object-storage Blob wiring: S3 > Blob > local preference + config flags.
 * Run: node --test scripts/blob-object-storage.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("blob object storage wiring", () => {
  it("adds a Vercel Blob provider with token detection", () => {
    const src = read("services/storage/blob-provider.ts");
    assert.match(src, /from "@vercel\/blob"/);
    assert.match(src, /BLOB_READ_WRITE_TOKEN/);
    assert.match(src, /name:\s*"blob"/);
    assert.match(src, /export function tryCreateBlobObjectStorage/);
    assert.match(src, /export function readBlobEnvConfig/);
    assert.match(src, /access:\s*access/);
  });

  it("prefers S3, then Blob, then local", () => {
    const src = read("services/storage/object-storage.ts");
    assert.match(src, /tryCreateBlobObjectStorage/);
    assert.match(
      src,
      /tryCreateS3ObjectStorage\(\)\s*\?\?\s*tryCreateBlobObjectStorage\(\)\s*\?\?\s*localObjectStorage/,
    );
  });

  it("extends StoredObject provider union with blob", () => {
    const src = read("services/storage/types.ts");
    assert.match(src, /"local" \| "s3" \| "blob"/);
  });

  it("production config treats Blob or S3 as configured object storage", () => {
    const src = read("services/auth/production-config.ts");
    assert.match(src, /readBlobEnvConfig/);
    assert.match(src, /readS3EnvConfig\(\) \|\| readBlobEnvConfig\(\)/);
    assert.match(src, /warnings\.push\("BLOB_READ_WRITE_TOKEN"\)/);
  });

  it("media route redirects for blob providers", () => {
    const src = read("app/api/media/[...key]/route.ts");
    assert.match(src, /storage\.name === "blob"/);
  });

  it("depends on @vercel/blob", () => {
    const pkg = JSON.parse(read("package.json"));
    assert.ok(pkg.dependencies["@vercel/blob"]);
  });

  it("documents Blob token for production media", () => {
    assert.match(read("PRODUCTION_DEPLOYMENT_GUIDE.md"), /BLOB_READ_WRITE_TOKEN/);
    assert.match(read(".env.example"), /BLOB_READ_WRITE_TOKEN/);
  });
});
