import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import { setSessionCookie } from "@/services/auth/session-cookie";
import { setPendingEmail } from "@/services/auth/user-store";

/** Cancel an in-flight email change and clear pendingEmail. */
export async function POST() {
  const session = await requireSessionUser();
  if (!isSessionUser(session)) return session;

  const user = await setPendingEmail(session.id, null);
  if (!user) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  await setSessionCookie(user);
  return NextResponse.json({
    ok: true,
    user,
    message: "تم إلغاء طلب تغيير البريد.",
  });
}
