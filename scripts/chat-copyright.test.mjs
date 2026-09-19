import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("server-backed buyer↔seller chat", () => {
  it("chat service talks to /api/chat/conversations", () => {
    const service = read("services/chat/chat.service.ts");
    assert.match(service, /\/api\/chat\/conversations/);
    assert.match(service, /export async function openListingConversation/);
    assert.match(service, /export async function syncChatConversationsFromServer/);
    assert.match(service, /export async function importConversationToServer/);
    assert.match(service, /mergeConversationMaps|pushLocalOnlyToServer/);
    assert.match(service, /action:\s*"message"/);
  });

  it("UI starts, lists, and sends via async server APIs", () => {
    const start = read("features/chat/components/StartChatButton.tsx");
    const inbox = read("features/chat/components/ChatInboxList.tsx");
    const view = read("features/chat/components/ChatConversationView.tsx");
    assert.match(start, /await openListingConversation/);
    assert.match(inbox, /syncChatConversationsFromServer/);
    assert.match(view, /fetchConversationById/);
    assert.match(view, /await addMessageToConversation/);
    assert.doesNotMatch(view, /غير موجودة في هذا المتصفح/);
  });

  it("message route notifies and imports durable threads", () => {
    const route = read("app/api/chat/conversations/route.ts");
    assert.match(route, /createNotification/);
    assert.match(route, /type:\s*"chat_message"/);
    assert.match(route, /importServerConversation/);
    assert.match(route, /action === "import"/);
    assert.match(route, /OWN_LISTING/);
    assert.match(route, /LISTING_NOT_PUBLIC/);
  });

  it("email chat preview sets text direction for Arabic", () => {
    const email = read("services/email/notification-emails.ts");
    assert.match(email, /dir="rtl"/);
    assert.match(email, /dir="auto"/);
  });
});

describe("mobile city pill and admin shell", () => {
  it("does not clip Abu Dhabi on compact phones", () => {
    const css = read("features/home/components/mobile/mobile-home.css");
    assert.doesNotMatch(css, /location-value \{\s*max-width:\s*3\.25rem/);
    assert.match(css, /mobile-home-header__location--bar/);
    assert.match(css, /#c4a035|#d4af37|fffdf6/);
  });

  it("keeps admin logout from overlapping identity on mobile", () => {
    const css = read("features/admin/components/admin-ops.css");
    const shell = read("features/admin/components/AdminShell.tsx");
    assert.match(css, /admin-ops__logout-btn/);
    assert.match(css, /\.admin-ops__who \{\s*display:\s*none/);
    assert.match(shell, /admin-ops__logout-btn/);
  });
});

describe("footer copyright without domain spam", () => {
  it("uses Arabic copyright and drops stacked brand/domain credit", () => {
    const brand = read("shared/constants/brand.ts");
    const footer = read("shared/layouts/SiteFooter.tsx");
    assert.match(brand, /© 2026 سوقنا\. جميع الحقوق محفوظة\./);
    assert.match(footer, /BRAND\.copyright/);
    assert.doesNotMatch(footer, /site-footer__credit/);
    assert.doesNotMatch(footer, /BRAND\.domain/);
  });
});
