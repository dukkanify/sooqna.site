import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  appendServerMessage,
  getConversationById,
  listConversationsForUser,
  markConversationReadForUser,
  resolveOrCreateServerConversation,
} from "@/services/chat/chat-server-store";

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
    listing?: {
      id: string;
      title: string;
      slug: string;
      sellerId: string;
      sellerName: string;
    };
  };

  try {
    if (body.action === "open" && body.listing) {
      const conversation = await resolveOrCreateServerConversation({
        buyerId: user.id,
        buyerName: user.fullName,
        listingId: body.listing.id,
        listingTitle: body.listing.title,
        listingSlug: body.listing.slug,
        sellerId: body.listing.sellerId,
        sellerName: body.listing.sellerName,
      });
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
