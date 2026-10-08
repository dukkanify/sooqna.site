/**
 * Profile / favorites EN locale must cover helper copy (no Arabic leftover).
 * Run: node --test scripts/profile-en-no-arabic.test.mjs
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

describe("profile English phrase coverage", () => {
  it("covers favorites, saved searches, save banner, and change-email CTA", () => {
    const phrases = JSON.parse(read("shared/i18n/phrases.en.json"));
    const required = [
      "الإعلانات التي حفظتها من زر القلب — يمكنك الرجوع إليها من هنا في أي وقت.",
      "احفظ بحثاً من صفحة النتائج — سنرسل إشعاراً عند ظهور إعلان مطابق.",
      "تم حفظ التغييرات في حسابك.",
      "التغييرات تُحفظ في حسابك وتظهر على كل الأجهزة بعد تسجيل الدخول.",
      "تغيير البريد",
      "تغيير البريد الإلكتروني",
      "يتطلب تأكيد كلمة المرور أو رمز تحقق، ثم تأكيد البريد الجديد قبل الاعتماد.",
      "لتغيير البريد استخدم القسم الآمن أدناه",
      "طلبات تواصل معنا",
      "المفضلة",
      "عمليات البحث المحفوظة",
      "حفظ التغييرات",
    ];
    for (const key of required) {
      assert.equal(typeof phrases[key], "string", `missing EN phrase: ${key}`);
      assert.doesNotMatch(phrases[key], /[\u0600-\u06FF]/, key);
    }
  });

  it("profile page and form still source Arabic keys that phrases can map", () => {
    const page = read("app/profile/page.tsx");
    const form = read("features/profile/components/ProfileForm.tsx");
    const email = read("features/profile/components/ChangeEmailSection.tsx");
    assert.match(page, /الإعلانات التي حفظتها من زر القلب/);
    assert.match(page, /احفظ بحثاً من صفحة النتائج/);
    assert.match(form, /تم حفظ التغييرات في حسابك\./);
    assert.match(form, /التغييرات تُحفظ في حسابك/);
    assert.match(form, /لتغيير البريد استخدم القسم الآمن أدناه/);
    assert.match(email, /تغيير البريد/);
  });
});
