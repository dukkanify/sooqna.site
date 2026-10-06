/**
 * Contact Us ticket tracking: number, statuses, track API, profile.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeSupportMessageStatus,
  SUPPORT_MESSAGE_STATUS_LABELS,
} from "../types/domain/support-message.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("support ticket statuses", () => {
  it("maps legacy codes to مستلم / قيد المراجعة / تم الرد / مغلق", () => {
    assert.equal(normalizeSupportMessageStatus("open"), "received");
    assert.equal(normalizeSupportMessageStatus("reviewed"), "in_review");
    assert.equal(normalizeSupportMessageStatus("resolved"), "replied");
    assert.equal(normalizeSupportMessageStatus("dismissed"), "closed");
    assert.equal(SUPPORT_MESSAGE_STATUS_LABELS.received, "مستلم");
    assert.equal(SUPPORT_MESSAGE_STATUS_LABELS.in_review, "قيد المراجعة");
    assert.equal(SUPPORT_MESSAGE_STATUS_LABELS.replied, "تم الرد");
    assert.equal(SUPPORT_MESSAGE_STATUS_LABELS.closed, "مغلق");
  });
});

describe("support ticket product wiring", () => {
  it("creates ticket number, ack email, and track path on POST", () => {
    const src = read("app/api/support/route.ts");
    assert.match(src, /ticketNumber/);
    assert.match(src, /trackPath/);
    assert.match(src, /support_ack/);
    assert.match(src, /getValidSessionUser/);
    assert.match(src, /userId:\s*sessionUser\?\.id/);
  });

  it("store is durable and supports lookup by ticket+email", () => {
    const src = read("services/support/support-message-store.ts");
    assert.match(src, /createPayloadCollectionStore/);
    assert.match(src, /marketplace_support_messages/);
    assert.match(src, /lookupSupportTicket/);
    assert.match(src, /getSupportMessagesForUser/);
    assert.match(src, /SQ-/);
  });

  it("guest track + mine APIs and pages exist", () => {
    assert.match(read("app/api/support/track/route.ts"), /lookupSupportTicket/);
    assert.match(read("app/api/support/mine/route.ts"), /requireSessionUser/);
    assert.match(
      read("app/support/track/page.tsx"),
      /SupportTicketTrackForm/,
    );
    assert.match(
      read("features/support/components/SupportContactForm.tsx"),
      /ticketNumber/,
    );
    assert.match(
      read("app/profile/page.tsx"),
      /SupportTicketsPanel/,
    );
    assert.match(read("app/contact/page.tsx"), /redirect\("\/support"\)/);
  });

  it("admin panel uses new statuses and shows ticket number", () => {
    const panel = read("features/admin/components/AdminSupportMessagesPanel.tsx");
    const route = read("app/api/admin/support-messages/[id]/route.ts");
    assert.match(panel, /ticketNumber/);
    assert.match(panel, /in_review/);
    assert.match(panel, /"replied"/);
    assert.match(panel, /"closed"/);
    assert.doesNotMatch(panel, /status === "open"/);
    assert.match(route, /z\.enum\(\["received", "in_review", "replied", "closed"\]\)/);
    assert.match(route, /support_status/);
  });
});
