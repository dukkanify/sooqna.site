/**
 * Escrow auto-release eligibility — hold window + proof gating.
 * Run: npm test
 */
import assert from "node:assert/strict";
import test from "node:test";

function daysBetween(fromIso, to = new Date()) {
  const from = new Date(fromIso).getTime();
  if (!Number.isFinite(from)) return 0;
  return (to.getTime() - from) / 86_400_000;
}

function isOrderEligibleForAutoRelease(order, holdDays, now = new Date()) {
  const held =
    order.escrowStatus === "held" ||
    order.status === "paid_held_in_escrow" ||
    order.status === "delivered";
  if (!held || !order.sellerProofAt) return false;
  if (order.status === "disputed" || order.status === "refunded") return false;
  return daysBetween(order.sellerProofAt, now) >= holdDays;
}

test("auto-release eligibility requires seller proof and hold window", () => {
  const now = new Date("2026-09-15T12:00:00.000Z");
  const freshProof = new Date(now.getTime() - 2 * 86_400_000).toISOString();
  const oldProof = new Date(now.getTime() - 8 * 86_400_000).toISOString();

  assert.equal(
    isOrderEligibleForAutoRelease(
      { status: "delivered", escrowStatus: "held", sellerProofAt: freshProof },
      7,
      now,
    ),
    false,
  );

  assert.equal(
    isOrderEligibleForAutoRelease(
      { status: "delivered", escrowStatus: "held", sellerProofAt: oldProof },
      7,
      now,
    ),
    true,
  );

  assert.equal(
    isOrderEligibleForAutoRelease(
      { status: "disputed", escrowStatus: "held", sellerProofAt: oldProof },
      7,
      now,
    ),
    false,
  );

  assert.equal(
    isOrderEligibleForAutoRelease(
      { status: "paid_held_in_escrow", escrowStatus: "held" },
      7,
      now,
    ),
    false,
  );
});
