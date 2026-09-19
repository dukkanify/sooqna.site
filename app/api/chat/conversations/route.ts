import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  appendServerMessage,
  getConversationById,
  importServerConversation,
  listConversationsForUser,
  markConversationReadForUser,
  resolveOrCreateServerConversation,
  type ServerChatConversation,
} from "@/services/chat/chat-server-store";
import { getListingById } from "@/services/listings/listing-store";
import { isPublicListingStatus } from "@/shared/constants/listingStatuses";
import { createNotification } from "@/services/payments/notification-store";

export async function GET() {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;
  const conversations = await listConversationsForUser(user.id);
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    conversationId?: string;
    message?: string;
    conversation?: ServerChatConversation;
    listing?: {
      id: string;
      title: string;
      slug: string;
      sellerId: string;
      sellerName: string;
    };
  };

  try {
    if (body.action === "import" && body.conversation) {
      const conversation = await importServerConversation(
        body.conversation,
        user.id,
      );
      return NextResponse.json({ conversation });
    }

    if (body.action === "open" && body.listing) {
      if (!body.listing.sellerId || body.listing.sellerId === user.id) {
        return NextResponse.json({ error: "OWN_LISTING" }, { status: 400 });
      }
      const listing = await getListingById(body.listing.id);
      if (listing && !isPublicListingStatus(listing.status)) {
        return NextResponse.json(
          { error: "LISTING_NOT_PUBLIC" },
          { status: 403 },
        );
      }
      const existingBefore = await getConversationById(
        `chat-${body.listing.id}-${user.id}`,
      );
      const conversation = await resolveOrCreateServerConversation({
        buyerId: user.id,
        buyerName: user.fullName,
        listingId: body.listing.id,
        listingTitle: body.listing.title || listing?.title || "إعلان",
        listingSlug: body.listing.slug || listing?.slug || body.listing.id,
        sellerId: body.listing.sellerId,
        sellerName:
          body.listing.sellerName || listing?.seller.name || "البائع",
      });
      if (!existingBefore) {
        const preview =
          conversation.messages[conversation.messages.length - 1]?.body?.slice(
            0,
            120,
          ) ?? "";
        void createNotification({
          userId: conversation.sellerId,
          type: "chat_message",
          title: "رسالة جديدة",
          titleEn: "New message",
          body: `${user.fullName}: ${preview}`,
          bodyEn: `${user.fullName}: ${preview}`,
          href: `/chat/${conversation.id}`,
          dedupeKey: `chat-open:${conversation.id}`,
        }).catch((error) => {
          console.error("[Sooqna Chat] open notify failed", error);
        });
      }
      return NextResponse.json({ conversation });
    }

    if (body.action === "message" && body.conversationId && body.message) {
      const conversation = await appendServerMessage({
        conversationId: body.conversationId,
        senderId: user.id,
        body: body.message,
      });
      if (!conversation) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }

      const recipientId =
        conversation.buyerId === user.id
          ? conversation.sellerId
          : conversation.buyerId;
      const preview = body.message.trim().slice(0, 120);
      void createNotification({
        userId: recipientId,
        type: "chat_message",
        title: "رسالة جديدة",
        titleEn: "New message",
        body: `${user.fullName}: ${preview}`,
        bodyEn: `${user.fullName}: ${preview}`,
        href: `/chat/${conversation.id}`,
        dedupeKey: `chat:${conversation.id}:${conversation.updatedAt}`,
      }).catch((error) => {
        console.error("[Sooqna Chat] in-app notify failed", error);
      });

      return NextResponse.json({ conversation });
    }

    if (body.action === "read" && body.conversationId) {
      const conversation = await markConversationReadForUser(
        body.conversationId,
        user.id,
      );
      if (!conversation) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ conversation });
    }

    if (body.conversationId) {
      const conversation = await getConversationById(body.conversationId);
      if (!conversation) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
      if (
        conversation.buyerId !== user.id &&
        conversation.sellerId !== user.id
      ) {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
      }
      return NextResponse.json({ conversation });
    }

    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CHAT_FAILED";
    const status = message === "UNAUTHORIZED" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
