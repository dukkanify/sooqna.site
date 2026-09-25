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

/** Serialize mutations per conversation so mark-read cannot clobber a send. */
const conversationLocks = new Map<string, Promise<unknown>>();

function withConversationLock<T>(
  conversationId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = conversationLocks.get(conversationId) ?? Promise.resolve();
  const run = previous.then(fn, fn);
  conversationLocks.set(
    conversationId,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

export async function listConversationsForUser(
  userId: string,
): Promise<ServerChatConversation[]> {
  const all = await store.listAll();
  const direct = all.filter(
    (item) => item.buyerId === userId || item.sellerId === userId,
  );
  const orphans = all.filter(
    (item) => item.buyerId !== userId && item.sellerId !== userId,
  );

  const repaired: ServerChatConversation[] = [];
  if (orphans.length > 0) {
    const { getAllListings } = await import("@/services/listings/listing-store");
    const listings = await getAllListings().catch(
      () => [] as Awaited<ReturnType<typeof getAllListings>>,
    );
    const ownedKeys = new Set(
      listings
        .filter((listing) => listing.seller.id === userId)
        .flatMap((listing) => [listing.id, listing.slug].filter(Boolean)),
    );
    for (const item of orphans) {
      if (
        !ownedKeys.has(item.listingId) &&
        !ownedKeys.has(item.listingSlug)
      ) {
        continue;
      }
      try {
        repaired.push(await repairConversationSellerIfOwner(item, userId));
      } catch {
        // Not an owner after all — skip.
      }
    }
  }

  const byId = new Map<string, ServerChatConversation>();
  for (const item of [...direct, ...repaired]) {
    byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function getConversationById(
  conversationId: string,
): Promise<ServerChatConversation | undefined> {
  const all = await store.listAll();
  return all.find((item) => item.id === conversationId);
}

/** True when the user is a stored participant. */
export function isConversationParticipant(
  conversation: ServerChatConversation,
  userId: string,
): boolean {
  return conversation.buyerId === userId || conversation.sellerId === userId;
}

/**
 * If the signed-in user owns the listing, rewrite sellerId so they can reply
 * even when the thread was opened with a stale/wrong seller id.
 */
export async function repairConversationSellerIfOwner(
  conversation: ServerChatConversation,
  userId: string,
): Promise<ServerChatConversation> {
  if (isConversationParticipant(conversation, userId)) {
    return conversation;
  }

  const { getListingById, getListingBySlug, getAllListings } = await import(
    "@/services/listings/listing-store"
  );
  let listing =
    (await getListingById(conversation.listingId).catch(() => undefined)) ??
    (await getListingBySlug(conversation.listingSlug).catch(() => undefined));

  if (!listing || listing.seller.id !== userId) {
    const all = await getAllListings().catch(() => [] as Awaited<
      ReturnType<typeof getAllListings>
    >);
    listing = all.find(
      (item) =>
        item.seller.id === userId &&
        (item.id === conversation.listingId ||
          item.slug === conversation.listingSlug),
    );
  }

  if (!listing || listing.seller.id !== userId) {
    throw new Error("UNAUTHORIZED");
  }

  return upsertMergingMessages({
    ...conversation,
    sellerId: userId,
    sellerName: listing.seller.name || conversation.sellerName,
    listingId: listing.id || conversation.listingId,
    listingSlug: listing.slug || conversation.listingSlug,
  });
}

export async function upsertConversation(
  conversation: ServerChatConversation,
): Promise<ServerChatConversation> {
  return store.upsert(conversation);
}

/**
 * Upsert while preserving the richer message history (guards concurrent
 * mark-read / send races that would otherwise drop the latest message).
 */
async function upsertMergingMessages(
  next: ServerChatConversation,
): Promise<ServerChatConversation> {
  const existing = await getConversationById(next.id);
  if (!existing) return store.upsert(next);

  const byMsgId = new Map<string, ServerChatMessage>();
  for (const msg of [...existing.messages, ...next.messages]) {
    if (msg?.id) byMsgId.set(msg.id, msg);
  }
  const messages = [...byMsgId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const updatedAt =
    next.updatedAt.localeCompare(existing.updatedAt) > 0
      ? next.updatedAt
      : existing.updatedAt;

  return store.upsert({
    ...existing,
    ...next,
    messages,
    updatedAt,
    lastReadAtBy: {
      ...(existing.lastReadAtBy ?? {}),
      ...(next.lastReadAtBy ?? {}),
    },
  });
}

/**
 * Merge a client-held thread into the durable store.
 * Keeps the richer message history when both sides exist.
 */
export async function importServerConversation(
  incoming: ServerChatConversation,
  actorUserId: string,
): Promise<ServerChatConversation> {
  let snapshot = incoming;
  if (
    snapshot.buyerId !== actorUserId &&
    snapshot.sellerId !== actorUserId
  ) {
    const { getListingById, getListingBySlug } = await import(
      "@/services/listings/listing-store"
    );
    const listing =
      (await getListingById(snapshot.listingId).catch(() => undefined)) ??
      (await getListingBySlug(snapshot.listingSlug).catch(() => undefined));
    if (!listing || listing.seller.id !== actorUserId) {
      throw new Error("UNAUTHORIZED");
    }
    snapshot = {
      ...snapshot,
      sellerId: actorUserId,
      sellerName: listing.seller.name || snapshot.sellerName,
    };
  }
  if (!snapshot.id || !snapshot.listingId || !snapshot.buyerId || !snapshot.sellerId) {
    throw new Error("INVALID_INPUT");
  }

  return upsertMergingMessages({
    ...snapshot,
    messages: Array.isArray(snapshot.messages) ? snapshot.messages : [],
    updatedAt: snapshot.updatedAt || new Date().toISOString(),
    createdAt: snapshot.createdAt || new Date().toISOString(),
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
  return withConversationLock(input.conversationId, async () => {
    let conversation = await getConversationById(input.conversationId);
    if (!conversation) return undefined;

    if (!isConversationParticipant(conversation, input.senderId)) {
      conversation = await repairConversationSellerIfOwner(
        conversation,
        input.senderId,
      );
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
    return upsertMergingMessages(next);
  });
}

export async function markConversationReadForUser(
  conversationId: string,
  userId: string,
): Promise<ServerChatConversation | undefined> {
  return withConversationLock(conversationId, async () => {
    let conversation = await getConversationById(conversationId);
    if (!conversation) return undefined;
    if (!isConversationParticipant(conversation, userId)) {
      conversation = await repairConversationSellerIfOwner(conversation, userId);
    }
    const now = new Date().toISOString();
    return upsertMergingMessages({
      ...conversation,
      lastReadAtBy: {
        ...(conversation.lastReadAtBy ?? {}),
        [userId]: now,
      },
    });
  });
}
