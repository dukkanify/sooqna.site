/**
 * Neon/Postgres pool resilience: short transient handling, no long blackout.
 * Run: node --test --experimental-strip-types scripts/postgres-resilience.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  __postgresTest,
  clearPostgresDegraded,
  isPostgresQuotaExceededError,
  isPostgresTemporarilyUnavailable,
  isPostgresTransientDisconnectError,
  markPostgresUnavailable,
  normalizePostgresSslMode,
} from "../services/db/postgres.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("postgres resilience", () => {
  it("classifies Neon socket drops as transient disconnects", () => {
    assert.equal(
      isPostgresTransientDisconnectError({
        message: "Connection terminated unexpectedly",
      }),
      true,
    );
    assert.equal(
      isPostgresTransientDisconnectError({ code: "ECONNRESET" }),
      true,
    );
    assert.equal(
      isPostgresQuotaExceededError({
        message: "Connection terminated unexpectedly",
      }),
      false,
    );
  });

  it("uses a short degrade TTL for transient errors (not hours)", () => {
    assert.ok(__postgresTest.transientTtlMs <= 30_000);
    assert.ok(__postgresTest.transientTtlMs >= 5_000);
    assert.ok(__postgresTest.quotaTtlMs >= 60 * 60 * 1000);
  });

  it("markPostgresUnavailable for transient clears within the short TTL window", () => {
    clearPostgresDegraded();
    markPostgresUnavailable({ message: "Connection terminated unexpectedly" });
    assert.equal(isPostgresTemporarilyUnavailable(), true);
    // Do not leave the process degraded for the rest of the suite.
    clearPostgresDegraded();
    assert.equal(isPostgresTemporarilyUnavailable(), false);
  });

  it("normalizes legacy sslmode values to verify-full", () => {
    assert.equal(
      normalizePostgresSslMode(
        "postgres://u:p@ep-x.neon.tech/db?sslmode=require",
      ),
      "postgres://u:p@ep-x.neon.tech/db?sslmode=verify-full",
    );
    assert.equal(
      normalizePostgresSslMode(
        "postgresql://u:p@h/db?sslmode=prefer&connect_timeout=10",
      ),
      "postgresql://u:p@h/db?sslmode=verify-full&connect_timeout=10",
    );
    assert.equal(
      normalizePostgresSslMode(
        "postgres://u:p@h/db?foo=1&sslmode=verify-ca",
      ),
      "postgres://u:p@h/db?foo=1&sslmode=verify-full",
    );
  });

  it("Stripe and auth pools reuse shared SSL helpers (no raw sslmode=require)", () => {
    for (const rel of [
      "services/payments/stripe-connect-store.ts",
      "services/payments/stripe-credentials-store.ts",
      "services/auth/user-persistence.ts",
    ]) {
      const src = read(rel);
      assert.match(src, /getPostgresConnectionString/);
      assert.match(src, /postgresPoolSslOption/);
      assert.doesNotMatch(src, /sslmode=require/);
    }
  });
});
