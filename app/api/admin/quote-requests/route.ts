import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { getAllQuoteRequests } from "@/services/quote-requests/quote-request-store";

export async function GET() {
  const admin = await requireAdminPermission("listings", "view");
  if (!isSessionUser(admin)) {
    return admin;
  }
  const quoteRequests = await getAllQuoteRequests();
  return NextResponse.json({ quoteRequests });
}
