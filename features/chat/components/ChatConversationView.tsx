"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ChatConversation } from "@/services/chat";
import {
  addMessageToConversation,
  counterpartName,
  fetchConversationById,
  markConversationRead,
} from "@/services/chat";
import { STORAGE_EVENTS } from "@/shared/constants/brand";
import { notifyChatEmail } from "@/features/chat/lib/notify-chat-email";
import { getSessionUser } from "@/services/storage";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";

type ChatConversationViewProps = {
  conversationId: string;
};

export function ChatConversationView({ conversationId }: ChatConversationViewProps) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const sync = useCallback(async () => {
    try {
      const current = await fetchConversationById(conversationId);
      setConversation(current);
      if (current) {
        void markConversationRead(conversationId, current);
      }
    } catch {
      setConversation(null);
    } finally {
      setIsReady(true);
    }
  }, [conversationId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void sync();
    }, 0);
    const onLocal = () => {
      void sync();
    };
    window.addEventListener(STORAGE_EVENTS.chatChange, onLocal);
    const timer = window.setInterval(() => {
      void sync();
    }, 8000);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(STORAGE_EVENTS.chatChange, onLocal);
      window.clearInterval(timer);
    };
  }, [sync]);

  if (!isReady) {
    return <Card className="p-6">جاري تحميل المحادثة...</Card>;
  }

  if (!conversation) {
    return (
      <LocalizedTree>
      <EmptyState
        actionHref="/chat"
        actionLabel="العودة للرسائل"
        description="هذه المحادثة غير متاحة لحسابك، أو ربما تم حذفها. افتح صندوق الرسائل لعرض محادثاتك."
        icon="message"
        title="المحادثة غير موجودة"
      />
      </LocalizedTree>
    );
  }

  const user = getSessionUser();
  const listingHref = conversation.listingId.startsWith("local-")
    ? `/listings/local/${conversation.listingId}`
    : `/listings/${conversation.listingSlug}`;
  const otherName = counterpartName(conversation, user?.id);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!user) {
      setError("يلزم تسجيل الدخول لإرسال الرسائل.");
      return;
    }

    if (!message.trim()) {
      setError("اكتب رسالة قبل الإرسال.");
      return;
    }

    if (!conversation) {
      setError("المحادثة غير متاحة.");
      return;
    }

    setIsSending(true);
    try {
      const updated = await addMessageToConversation(
        conversation.id,
        user.id,
        message.trim(),
        conversation,
      );

      if (!updated) {
        setError("تعذر إرسال الرسالة. حدّث الصفحة وحاول مرة أخرى.");
        return;
      }

      const recipientUserId =
        user.id === conversation.sellerId
          ? conversation.buyerId
          : conversation.sellerId;
      notifyChatEmail({
        conversationId: conversation.id,
        listingTitle: conversation.listingTitle,
        preview: message.trim(),
        recipientUserId,
        senderName: user.fullName,
      });

      setConversation(updated);
      setMessage("");
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "UNAUTHORIZED") {
        setError("لا يمكنك الرد في هذه المحادثة بهذا الحساب.");
      } else if (code === "NOT_FOUND") {
        setError("المحادثة غير موجودة على الخادم. افتحها من صندوق الرسائل وحاول مرة أخرى.");
      } else {
        setError("تعذر إرسال الرسالة. تحقق من الاتصال وحاول مرة أخرى.");
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <LocalizedTree>
    <div className="grid gap-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink" data-ugc>
              {conversation.listingTitle}
            </p>
            <p className="mt-1 text-xs text-muted" data-ugc>
              مع {otherName}
            </p>
          </div>
          <Button href={listingHref} size="sm" variant="secondary">
            عرض الإعلان
          </Button>
        </div>
      </Card>

      <Card className="flex min-h-[24rem] flex-col p-4">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {conversation.messages.map((item) => {
            const isMine = user?.id === item.senderId;
            return (
              <div
                key={item.id}
                className={`max-w-[85%] rounded-[var(--radius-xl)] px-4 py-3 text-sm ${
                  isMine
                    ? "ms-auto bg-primary text-white"
                    : "bg-surface-muted text-ink"
                }`}
              >
                <p data-ugc>{item.body}</p>
                <p className={`mt-1 text-[0.65rem] ${isMine ? "text-white/70" : "text-muted"}`}>
                  {new Date(item.createdAt).toLocaleString("ar-AE", {
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                  })}
                </p>
              </div>
            );
          })}
        </div>

        <form className="mt-4 grid gap-2 border-t border-border pt-4" onSubmit={(e) => void handleSend(e)}>
          <Input
            label="رسالتك"
            name="message"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="اكتب رسالتك هنا..."
            value={message}
          />
          {error ? <FormMessage variant="error">{error}</FormMessage> : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button loading={isSending} type="submit" variant="primary">
              <Icon className="shrink-0" name="send" size={16} />
              إرسال
            </Button>
            <Link className="text-sm font-medium text-muted hover:text-ink" href="/chat">
              كل المحادثات
            </Link>
          </div>
        </form>
      </Card>
    </div>
    </LocalizedTree>
  );
}
