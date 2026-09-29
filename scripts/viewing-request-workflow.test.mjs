/**
 * Viewing request workflow: statuses, availability, activity detail.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isDateAllowedForWeekdays,
  VIEWING_STATUS_LABELS,
} from "../shared/listings/viewing-availability.ts";
import { listDefaultViewingTimeSlots } from "../shared/constants/viewing-slots.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("viewing status labels (Task 15)", () => {
  it("maps pending / confirmed / modification_proposed / cancelled", () => {
    assert.equal(VIEWING_STATUS_LABELS.pending, "بانتظار الرد");
    assert.equal(VIEWING_STATUS_LABELS.confirmed, "مؤكد");
    assert.equal(VIEWING_STATUS_LABELS.modification_proposed, "تعديل مقترح");
    assert.equal(VIEWING_STATUS_LABELS.cancelled, "ملغي");
  });
});

describe("seller availability helpers", () => {
  it("filters dates by weekday preferences", () => {
    const monday = "2026-10-05"; // Monday
    assert.equal(isDateAllowedForWeekdays([1, 3], monday), true);
    assert.equal(isDateAllowedForWeekdays([0, 6], monday), false);
    assert.ok(listDefaultViewingTimeSlots().includes("10:00"));
  });
});

describe("viewing workflow wiring", () => {
  it("labels module uses Task 15 Arabic statuses", () => {
    const labels = read("shared/listings/viewing-availability.ts");
    const activity = read("services/activity/activity-labels.ts");
    assert.match(labels, /بانتظار الرد/);
    assert.match(labels, /تعديل مقترح/);
    assert.match(labels, /ملغي/);
    assert.match(activity, /VIEWING_STATUS_LABELS/);
    assert.match(activity, /modification_proposed/);
  });

  it("store supports proposeViewingModification + modification_proposed", () => {
    const store = read("services/viewing-bookings/viewing-booking-store.ts");
    assert.match(store, /proposeViewingModification/);
    assert.match(store, /modification_proposed/);
    assert.match(store, /getSellerViewingAvailability/);
  });

  it("activity feed shows viewing details and propose/confirm/cancel", () => {
    const feed = read("features/activity/components/ActivityFeed.tsx");
    const actions = read(
      "features/activity/components/ViewingRequestActions.tsx",
    );
    assert.match(feed, /ViewingRequestActions/);
    assert.match(actions, /اعتماد الموعد/);
    assert.match(actions, /اقتراح تعديل/);
    assert.match(actions, /modification_proposed/);
    assert.match(actions, /viewingPhone/);
  });

  it("profile hosts viewing availability panel + API", () => {
    assert.match(read("app/profile/page.tsx"), /ViewingAvailabilityPanel/);
    assert.match(
      read("app/api/viewing-bookings/availability/route.ts"),
      /saveSellerViewingAvailability/,
    );
    assert.match(
      read("features/profile/components/ViewingAvailabilityPanel.tsx"),
      /حفظ أوقات المعاينة/,
    );
  });

  it("status notify emails include appointment details", () => {
    const notify = read("services/activity/activity-status-notify.ts");
    assert.match(notify, /الموعد:/);
    assert.match(notify, /modification_proposed/);
  });

  it("EN phrases cover workflow copy", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    assert.equal(phrases["بانتظار الرد"], "Awaiting response");
    assert.equal(phrases["تعديل مقترح"], "Modification proposed");
    assert.equal(phrases["أوقات المعاينة المتاحة"], "Available viewing times");
  });
});
