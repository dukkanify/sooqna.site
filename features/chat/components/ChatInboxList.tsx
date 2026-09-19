"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { STORAGE_EVENTS } from "@/shared/constants/brand";
import {
  counterpartName,
  getChatConversations,
  getConversationUnreadCount,
  syncChatConversationsFromServer,
  type ChatConversation,
} from "@/services/chat";
import { getSessionUser } from "@/services/storage";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useLocale } from "@/shared/i18n/useLocale";
import { intlLocale } from "@/shared/i18n/locale";

export function ChatInboxList() {
  const locale = useLocale();
  const [threads, setThreads] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getSessionUser();

  const sync = useCallback(async () => {
    try {
      const next = await syncChatConversationsFromServer();
      setThreads(next);
    } catch {
      setThreads(getChatConversations());
    } finally {
      setLoading(false);
    }
  }, []);

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
    }, 15000);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(STORAGE_EVENTS.chatChange, onLocal);
      window.clearInterval(timer);
    };
  }, [sync]);

  if (loading) {
    return (
      <LocalizedTree>
        <Card className="p-6 text-center text-sm text-muted">
          جاري تحميل الرسائل...
        </Card>
      </LocalizedTree>
    );
  }

  if (threads.length === 0) {
    return (
      <LocalizedTree>
      <Card className="p-6 text-center text-sm text-muted">
        لا توجد محادثات بعد. افتح «محادثة البائع» من أي إعلان لبدء محادثة.
      </Card>
      </LocalizedTree>
    );
  }

  return (
    <LocalizedTree>
    <div className="grid gap-4">
      <p className="text-sm text-muted">{threads.length} محادثة</p>
      {threads.map((thread) => {
        const lastMessage = thread.messages[thread.messages.length - 1];
        const other = counterpartName(thread, user?.id);
        const unread = user
          ? getConversationUnreadCount(thread, user.id)
          : 0;
        return (
          <Card key={thread.id} className="p-4" interactive variant="flat">
            <Link className="flex gap-4" href={`/chat/${thread.id}`}>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {other.slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink" data-ugc>
                    {other}
                  </p>
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(thread.updatedAt).toLocaleDateString(intlLocale(locale), {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs font-medium text-primary" data-ugc>
                  {thread.listingTitle}
                </p>
                <p className="mt-1 truncate text-sm text-muted" data-ugc>
                  {lastMessage?.body}
                </p>
              </div>
              {unread > 0 ? (
                <Badge variant="pending">{unread}</Badge>
              ) : (
                <Badge variant="muted">{thread.messages.length}</Badge>
              )}
            </Link>
          </Card>
        );
      })}
    </div>
    </LocalizedTree>
  );
}
