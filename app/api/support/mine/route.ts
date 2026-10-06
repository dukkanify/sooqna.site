import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  getSupportMessagesForUser,
  toSupportTicketReceipt,
} from "@/services/support/support-message-store";

export async function GET() {
  const session = await requireSessionUser();
  if (!isSessionUser(session)) return session;

  const messages = await getSupportMessagesForUser(session.id, session.email);
  return NextResponse.json({
    ok: true,
    tickets: messages.map(toSupportTicketReceipt),
  });
}
