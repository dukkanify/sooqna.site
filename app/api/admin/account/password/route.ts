import { NextResponse } from "next/server";
import { isSessionUser, requireAdminUser } from "@/services/auth/require-session";
import { setSessionCookie } from "@/services/auth/session-cookie";
import {
  applyAdminSetPassword,
  parseAdminNewPassword,
} from "@/services/admin/admin-set-password";

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) {
    return admin;
  }

  const body = (await request.json()) as Record<string, unknown>;
  const parsed = parseAdminNewPassword(body);
  if ("error" in parsed) {
    return NextResponse.json(parsed, { status: 400 });
  }

  const user = await applyAdminSetPassword({
    actor: admin,
    targetId: admin.id,
    password: parsed.password,
  });
  await setSessionCookie(user);

  return NextResponse.json(
    { ok: true, user, message: "تم حفظ كلمة المرور." },
    { headers: { "Cache-Control": "no-store" } },
  );
}
