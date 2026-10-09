/**
 * High-traffic EN leftovers: change-email copy + notification aria labels.
 * Run: node --test scripts/en-leftover-phrases.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("EN leftover phrase coverage", () => {
  it("covers change-email invalid address + dispute support email domain", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    const required = [
      "أدخل بريداً إلكترونياً صحيحاً.",
      "أدخل بريداً إلكترونياً صالحاً.",
      "للاستفسارات غير المرتبطة بنزاع مفتوح، استخدم صفحة الدعم أو support@sooqnauae.com.",
      "اختر مستخدماً وأدخل مبلغاً صالحاً.",
      "الإشعارات",
      "غير مقروء",
    ];
    for (const key of required) {
      assert.equal(typeof phrases[key], "string", `missing EN phrase: ${key}`);
      assert.doesNotMatch(phrases[key], /[\u0600-\u06FF]/, key);
    }
  });

  it("change-email UI/API use the phrase-covered invalid-email message", () => {
    const section = read("features/profile/components/ChangeEmailSection.tsx");
    const service = read("services/auth/email-change.service.ts");
    const route = read("app/api/profile/email/request/route.ts");
    assert.match(section, /أدخل بريداً إلكترونياً صحيحاً\./);
    assert.match(service, /أدخل بريداً إلكترونياً صحيحاً\./);
    assert.match(route, /أدخل بريداً إلكترونياً صحيحاً\./);
    assert.doesNotMatch(section, /صالحاً/);
  });

  it("NotificationBell localizes aria-labels with tx()", () => {
    const bell = read("features/notifications/NotificationBell.tsx");
    assert.match(bell, /aria-label=\{tx\(\s*locale,/);
    assert.match(bell, /الإشعارات، \$\{visibleUnread\} غير مقروء/);
  });
});
