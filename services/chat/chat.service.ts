import { STORAGE_EVENTS, STORAGE_KEYS } from "@/shared/constants/brand";
import type { Listing } from "@/types";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
};

export type ChatConversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  /** Per-user last-read map from the durable store (preferred). */
  lastReadAtBy?: Record<string, string>;
  /** Legacy single-field read marker (local cache only). */
  lastReadAt?: string;
};

type ApiConversation = ChatConversation;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readCache(): ChatConversation[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.chatConversations);
    return raw ? (JSON.parse(raw) as ChatConversation[]) : [];
  } catch {
    return [];
  }
}

function writeCache(conversations: ChatConversation[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    STORAGE_KEYS.chatConversations,
    JSON.stringify(conversations),
  );
  window.dispatchEvent(new Event(STORAGE_EVENTS.chatChange));
}

function upsertCache(conversation: ChatConversation) {
  const all = readCache().filter((item) => item.id !== conversation.id);
  writeCache([conversation, ...all]);
}

function replaceCache(conversations: ChatConversation[]) {
  writeCache(
    [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
}

/** Prefer the newer thread when merging local + server copies. */
function mergeConversationMaps(
  ...lists: ChatConversation[][]
): ChatConversation[] {
  const byId = new Map<string, ChatConversation>();
  for (const list of lists) {
    for (const item of list) {
      const existing = byId.get(item.id);
      if (
        !existing ||
        item.updatedAt.localeCompare(existing.updatedAt) > 0 ||
        item.messages.length > existing.messages.length
      ) {
        byId.set(item.id, item);
      }
    }
  }
  return [...byId.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

async function postChat(body: Record<string, unknown>): Promise<ApiConversation | null> {
  const response = await fetch("/api/chat/conversations", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || "CHAT_FAILED");
  }
  const data = (await response.json()) as { conversation?: ApiConversation };
  return data.conversation ?? null;
}

/** Push a local thread to the durable store so both parties can open email links. */
export async function importConversationToServer(
  conversation: ChatConversation,
): Promise<ChatConversation | null> {
  try {
    const saved = await postChat({
      action: "import",
      conversation: {
        id: conversation.id,
        listingId: conversation.listingId,
        listingTitle: conversation.listingTitle,
        listingSlug: conversation.listingSlug,
        sellerId: conversation.sellerId,
        sellerName: conversation.sellerName,
        buyerId: conversation.buyerId,
        buyerName: conversation.buyerName,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastReadAtBy: conversation.lastReadAtBy,
      },
    });
    if (saved) upsertCache(saved);
    return saved;
  } catch {
    return null;
  }
}

async function pushLocalOnlyToServer(
  local: ChatConversation[],
  server: ChatConversation[],
): Promise<ChatConversation[]> {
  const serverIds = new Set(server.map((item) => item.id));
  const imported: ChatConversation[] = [];
  for (const item of local) {
    if (serverIds.has(item.id)) continue;
    const saved = await importConversationToServer(item);
    if (saved) imported.push(saved);
  }
  return imported;
}

/** Sync inbox from the durable server store into local cache (merge, never wipe). */
export async function syncChatConversationsFromServer(): Promise<ChatConversation[]> {
  const local = readCache();
  const response = await fetch("/api/chat/conversations", {
    credentials: "include",
  });
  if (!response.ok) {
    return getChatConversations();
  }
  const data = (await response.json()) as { conversations?: ChatConversation[] };
  const server = Array.isArray(data.conversations) ? data.conversations : [];
  const imported = await pushLocalOnlyToServer(local, server);
  const merged = mergeConversationMaps(local, server, imported);
  replaceCache(merged);
  return merged;
}

export function getChatConversations(): ChatConversation[] {
  return readCache().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getChatConversationById(
  conversationId: string,
): ChatConversation | undefined {
  return readCache().find((item) => item.id === conversationId);
}

export function findConversationForListing(
  listingId: string,
  buyerId: string,
): ChatConversation | undefined {
  return readCache().find(
    (item) => item.listingId === listingId && item.buyerId === buyerId,
  );
}

export async function fetchConversationById(
  conversationId: string,
): Promise<ChatConversation | null> {
  const local = getChatConversationById(conversationId);
  try {
    const conversation = await postChat({
      conversationId,
      ...(local ? { conversation: local } : {}),
    });
    if (conversation) upsertCache(conversation);
    return conversation;
  } catch {
    if (!local) return null;
    const imported = await importConversationToServer(local);
    return imported ?? local;
  }
}

export async function openListingConversation(listing: Listing): Promise<string> {
  const conversation = await postChat({
    action: "open",
    listing: {
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      sellerId: listing.seller.id,
      sellerName: listing.seller.name,
    },
  });
  if (!conversation) {
    throw new Error("CHAT_OPEN_FAILED");
  }
  upsertCache(conversation);
  return conversation.id;
}

export async function addMessageToConversation(
  conversationId: string,
  _senderId: string,
  body: string,
  snapshot?: ChatConversation | null,
): Promise<ChatConversation | undefined> {
  const local =
    snapshot && snapshot.id === conversationId
      ? snapshot
      : getChatConversationById(conversationId);
  const payload = {
    action: "message" as const,
    conversationId,
    message: body,
    ...(local ? { conversation: local } : {}),
  };

  try {
    const conversation = await postChat(payload);
    if (conversation) upsertCache(conversation);
    return conversation ?? undefined;
  } catch (firstError) {
    // Recover missing/stale server threads using the local snapshot, then retry once.
    if (local) {
      const imported = await importConversationToServer(local);
      if (imported) {
        try {
          const conversation = await postChat({
            action: "message",
            conversationId: imported.id,
            message: body,
            conversation: imported,
          });
          if (conversation) upsertCache(conversation);
          return conversation ?? undefined;
        } catch {
          throw firstError;
        }
      }
    }
    throw firstError;
  }
}

export function getConversationUnreadCount(
  conversation: ChatConversation,
  userId: string,
): number {
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    return 0;
  }
  const lastReadRaw =
    conversation.lastReadAtBy?.[userId] ?? conversation.lastReadAt;
  const lastRead = lastReadRaw ? new Date(lastReadRaw).getTime() : 0;
  return conversation.messages.filter(
    (item) =>
      item.senderId !== userId && new Date(item.createdAt).getTime() > lastRead,
  ).length;
}

export function getUnreadChatCount(userId?: string | null): number {
  if (!userId) return 0;
  return readCache().reduce(
    (sum, conversation) => sum + getConversationUnreadCount(conversation, userId),
    0,
  );
}

export async function markConversationRead(
  conversationId: string,
  snapshot?: ChatConversation | null,
): Promise<void> {
  const local =
    snapshot && snapshot.id === conversationId
      ? snapshot
      : getChatConversationById(conversationId);
  try {
    const conversation = await postChat({
      action: "read",
      conversationId,
      ...(local ? { conversation: local } : {}),
    });
    if (conversation) upsertCache(conversation);
  } catch {
    // Best-effort — keep cache as-is.
  }
}

export function counterpartName(
  conversation: ChatConversation,
  userId?: string | null,
): string {
  if (!userId) return conversation.sellerName;
  return userId === conversation.sellerId
    ? conversation.buyerName
    : conversation.sellerName;
}

export async function getChatThreads() {
  if (typeof window === "undefined") return [];
  const conversations = await syncChatConversationsFromServer();
  return conversations.map((conversation) => ({
    id: conversation.id,
    listingTitle: conversation.listingTitle,
    participantName: conversation.sellerName,
    lastMessage:
      conversation.messages[conversation.messages.length - 1]?.body ?? "",
    lastMessageAt: conversation.updatedAt,
    unreadCount: 0,
    avatarUrl: undefined as string | undefined,
  }));
}

/** @deprecated Prefer openListingConversation (async server). */
export function resolveOrCreateConversation(input: {
  buyerId: string;
  buyerName: string;
  listing: Listing;
}): ChatConversation {
  const existing = findConversationForListing(input.listing.id, input.buyerId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const conversation: ChatConversation = {
    id: `chat-${input.listing.id}-${input.buyerId}`,
    listingId: input.listing.id,
    listingTitle: input.listing.title,
    listingSlug: input.listing.slug,
    sellerId: input.listing.seller.id,
    sellerName: input.listing.seller.name,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    messages: [
      {
        id: `msg-${Date.now()}`,
        body: `مرحباً، أنا مهتم بإعلان «${input.listing.title}».`,
        createdAt: now,
        senderId: input.buyerId,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  upsertCache(conversation);
  return conversation;
}

export async function getDemoChatThreads() {
  return [];
}
