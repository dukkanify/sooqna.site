/**
 * Neon/Postgres pool resilience: short transient handling, no long blackout.
 * Run: node --test --experimental-strip-types scripts/postgres-resilience.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  __postgresTest,
  clearPostgresDegraded,
  isPostgresQuotaExceededError,
  isPostgresTemporarilyUnavailable,
  isPostgresTransientDisconnectError,
  markPostgresUnavailable,
} from "../services/db/postgres.ts";

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
});
