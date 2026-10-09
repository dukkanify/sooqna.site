import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("notification sound + bell cue", () => {
  it("ships Web Audio chime helper", () => {
    const sound = read("features/notifications/notification-sound.ts");
    assert.match(sound, /export function playNotificationChime/);
    assert.match(sound, /AudioContext/);
    assert.match(sound, /export function unlockNotificationAudio/);
  });

  it("NotificationBell plays chime on unread rise and pulses the ring", () => {
    const bell = read("features/notifications/NotificationBell.tsx");
    assert.match(bell, /playNotificationChime/);
    assert.match(bell, /unlockNotificationAudio/);
    assert.match(bell, /noteNewUnread/);
    assert.match(bell, /ringPulse/);
    assert.match(bell, /notify-bell__ring--pulse/);
    assert.match(bell, /notify-bell__item--unread/);
  });

  it("notifications list marks unread with primary soft style", () => {
    const list = read("features/notifications/NotificationsList.tsx");
    assert.match(list, /item\.read/);
    assert.match(list, /bg-primary-soft/);
    assert.doesNotMatch(list, /🛎️/);
  });
});
