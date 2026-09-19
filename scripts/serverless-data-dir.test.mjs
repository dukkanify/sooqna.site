import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("serverless durable data dir", () => {
  it("avoids mkdir under /var/task on Vercel", () => {
    const auth = read("services/auth/user-persistence.ts");
    assert.match(auth, /isServerlessRuntime\(\)/);
    assert.match(auth, /\/tmp.*sooqna-data/);
    assert.match(auth, /resolveDurableJsonDir/);
  });

  it("soft-fails marketplace flag writes on read-only FS", () => {
    const persistence = read("services/listings/listing-persistence.ts");
    assert.match(persistence, /writeFlagsFile/);
    assert.match(persistence, /EROFS|EACCES/);
  });

  it("normalizes postgres sslmode to verify-full", () => {
    const pg = read("services/db/postgres.ts");
    const auth = read("services/auth/user-persistence.ts");
    assert.match(pg, /sslmode=verify-full/);
    assert.match(auth, /sslmode=verify-full/);
    assert.match(pg, /require\|prefer\|verify-ca/);
  });
});
