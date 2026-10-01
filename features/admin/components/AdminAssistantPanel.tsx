"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ADMIN_ASSISTANT_SUGGESTIONS } from "@/services/admin/assistant-knowledge";
import { adminFetch } from "@/features/admin/lib/admin-fetch";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  links?: { href: string; label: string }[];
  related?: { id: string; title: string }[];
};

type AssistantApiReply = {
  answer?: string;
  links?: { href: string; label: string }[];
  related?: { id: string; title: string }[];
  error?: string;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "مرحباً — أنا مساعد التعلّم في لوحة سوقنا. اسألني كيف تنفّذ مهمة إدارية، أو اختر اقتراحاً سريعاً في الأسفل.",
  links: [
    { href: "/admin", label: "الرئيسية" },
    { href: "/admin/listings", label: "الإعلانات" },
    { href: "/admin/orders", label: "الطلبات" },
  ],
};

type AdminAssistantPanelProps = {
  compact?: boolean;
};

export function AdminAssistantPanel({ compact = false }: AdminAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function ask(raw: string, articleId?: string) {
    const message = raw.trim();
    if ((!message && !articleId) || busy) return;

    setError(null);
    setBusy(true);
    if (message) {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "user", text: message },
      ]);
      setDraft("");
    }

    try {
      const response = await adminFetch("/api/admin/assistant", {
        method: "POST",
        body: JSON.stringify(
          articleId ? { articleId, message } : { message },
        ),
      });
      const data = (await response.json()) as AssistantApiReply;
      if (!response.ok) {
        throw new Error(data.error || "ASSISTANT_FAILED");
      }
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          text: data.answer || "تعذّر تحميل الرد.",
          links: data.links,
          related: data.related,
        },
      ]);
    } catch {
      setError("تعذّر الوصول للمساعد. تأكد من تسجيل الدخول كمدير ثم أعد المحاولة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`admin-assistant${compact ? " admin-assistant--compact" : ""}`}
    >
      {!compact ? (
        <div className="admin-ops__panel admin-assistant__intro">
          <div className="admin-ops__panel-head">
            <div>
              <h2 className="admin-ops__panel-title">مساعد التعلّم الذكي</h2>
              <p className="admin-ops__panel-sub">
                يشرح أقسام اللوحة ويرشدك خطوة بخطوة — من مراجعة الإعلانات إلى
                الضمان والنزاعات والإعدادات.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="admin-assistant__chat admin-ops__panel">
        <div className="admin-assistant__thread" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`admin-assistant__bubble admin-assistant__bubble--${message.role}`}
            >
              <p className="admin-assistant__bubble-role">
                {message.role === "user" ? "أنت" : "المساعد"}
              </p>
              <div className="admin-assistant__bubble-text">
                {message.text.split("\n").map((line, index) => (
                  <p key={`${message.id}-${index}`}>{line || "\u00a0"}</p>
                ))}
              </div>
              {message.links && message.links.length > 0 ? (
                <div className="admin-assistant__links">
                  {message.links.map((link) => (
                    <Link
                      key={`${message.id}-${link.href}`}
                      className="admin-assistant__chip"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
              {message.related && message.related.length > 0 ? (
                <div className="admin-assistant__related">
                  <p className="admin-assistant__related-label">مواضيع قريبة</p>
                  <div className="admin-assistant__links">
                    {message.related.map((item) => (
                      <button
                        key={item.id}
                        className="admin-assistant__chip"
                        disabled={busy}
                        onClick={() => ask(item.title, item.id)}
                        type="button"
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
          {busy ? (
            <p className="admin-assistant__typing">جاري تجهيز الرد…</p>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="admin-assistant__suggestions">
          {ADMIN_ASSISTANT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              className="admin-assistant__suggest"
              disabled={busy}
              onClick={() => ask(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form
          className="admin-assistant__composer"
          onSubmit={(event) => {
            event.preventDefault();
            void ask(draft);
          }}
        >
          <label className="admin-assistant__input-wrap">
            <span className="sr-only">سؤالك للمساعد</span>
            <input
              autoComplete="off"
              disabled={busy}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="مثال: كيف أفك مبلغ الضمان؟"
              value={draft}
            />
          </label>
          <Button disabled={busy || !draft.trim()} size="md" type="submit">
            <Icon name="send" size={16} />
            <span>إرسال</span>
          </Button>
        </form>
        {error ? <p className="admin-assistant__error">{error}</p> : null}
      </div>
    </div>
  );
}
