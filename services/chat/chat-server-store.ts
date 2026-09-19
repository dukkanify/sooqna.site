import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

export type ServerChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
};

export type ServerChatConversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  messages: ServerChatMessage[];
  createdAt: string;
  updatedAt: string;
  lastReadAtBy?: Record<string, string>;
};

const store = createPayloadCollectionStore<ServerChatConversation>({
  table: "marketplace_chat",
  fileName: "sooqna-chat.json",
});

export async function listConversationsForUser(
  userId: string,
): Promise<ServerChatConversation[]> {
  const all = await store.listAll();
  return all
    .filter((item) => item.buyerId === userId || item.sellerId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getConversationById(
  conversationId: string,
): Promise<ServerChatConversation | undefined> {
  const all = await store.listAll();
  return all.find((item) => item.id === conversationId);
}

export async function upsertConversation(
  conversation: ServerChatConversation,
): Promise<ServerChatConversation> {
  return store.upsert(conversation);
}

/**
 * Merge a client-held thread into the durable store.
 * Keeps the richer message history when both sides exist.
 */
export async function importServerConversation(
  incoming: ServerChatConversation,
  actorUserId: string,
): Promise<ServerChatConversation> {
  if (
    incoming.buyerId !== actorUserId &&
    incoming.sellerId !== actorUserId
  ) {
    throw new Error("UNAUTHORIZED");
  }
  if (!incoming.id || !incoming.listingId || !incoming.buyerId || !incoming.sellerId) {
    throw new Error("INVALID_INPUT");
  }

  const existing = await getConversationById(incoming.id);
  if (!existing) {
    return store.upsert({
      ...incoming,
      messages: Array.isArray(incoming.messages) ? incoming.messages : [],
      updatedAt: incoming.updatedAt || new Date().toISOString(),
      createdAt: incoming.createdAt || new Date().toISOString(),
    });
  }

  const byMsgId = new Map<string, ServerChatMessage>();
  for (const msg of [...existing.messages, ...incoming.messages]) {
    if (msg?.id) byMsgId.set(msg.id, msg);
  }
  const messages = [...byMsgId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const updatedAt =
    incoming.updatedAt.localeCompare(existing.updatedAt) > 0
      ? incoming.updatedAt
      : existing.updatedAt;

  return store.upsert({
    ...existing,
    listingTitle: incoming.listingTitle || existing.listingTitle,
    listingSlug: incoming.listingSlug || existing.listingSlug,
    buyerName: incoming.buyerName || existing.buyerName,
    sellerName: incoming.sellerName || existing.sellerName,
    messages,
    updatedAt,
    lastReadAtBy: {
      ...(existing.lastReadAtBy ?? {}),
      ...(incoming.lastReadAtBy ?? {}),
    },
  });
}

export async function resolveOrCreateServerConversation(input: {
  buyerId: string;
  buyerName: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  sellerId: string;
  sellerName: string;
}): Promise<ServerChatConversation> {
  const id = `chat-${input.listingId}-${input.buyerId}`;
  const existing = await getConversationById(id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const conversation: ServerChatConversation = {
    id,
    listingId: input.listingId,
    listingTitle: input.listingTitle,
    listingSlug: input.listingSlug,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    messages: [
      {
        id: `msg-${Date.now()}`,
        body: `مرحباً، أنا مهتم بإعلان «${input.listingTitle}».`,
        createdAt: now,
        senderId: input.buyerId,
      },
    ],
    createdAt: now,
    updatedAt: now,
    lastReadAtBy: { [input.buyerId]: now },
  };
  return store.upsert(conversation);
}

export async function appendServerMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
}): Promise<ServerChatConversation | undefined> {
  const conversation = await getConversationById(input.conversationId);
  if (!conversation) return undefined;
  if (
    conversation.buyerId !== input.senderId &&
    conversation.sellerId !== input.senderId
  ) {
    throw new Error("UNAUTHORIZED");
  }

  const now = new Date().toISOString();
  const next: ServerChatConversation = {
    ...conversation,
    messages: [
      ...conversation.messages,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        body: input.body.trim(),
        createdAt: now,
        senderId: input.senderId,
      },
    ],
    updatedAt: now,
  };
  return store.upsert(next);
}

export async function markConversationReadForUser(
  conversationId: string,
  userId: string,
): Promise<ServerChatConversation | undefined> {
  const conversation = await getConversationById(conversationId);
  if (!conversation) return undefined;
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    throw new Error("UNAUTHORIZED");
  }
  const now = new Date().toISOString();
  return store.upsert({
    ...conversation,
    lastReadAtBy: {
      ...(conversation.lastReadAtBy ?? {}),
      [userId]: now,
    },
  });
}
