import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { getAllSupportMessages } from "@/services/support/support-message-store";

export async function GET() {
  const admin = await requireAdminPermission("listings", "view");
  if (!isSessionUser(admin)) {
    return admin;
  }
  const messages = await getAllSupportMessages();
  return NextResponse.json({ messages });
}
