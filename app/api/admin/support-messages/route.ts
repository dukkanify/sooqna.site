import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
import { NextResponse } from "next/server";
import { getAllSupportMessages } from "@/services/support/support-message-store";

export async function GET() {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) {
    return admin;
  }
  const messages = await getAllSupportMessages();
  return NextResponse.json({ messages });
}
