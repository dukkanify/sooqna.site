import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmEmailChange } from "@/services/auth/email-change.service";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import { setSessionCookie } from "@/services/auth/session-cookie";

const schema = z.object({
  code: z.string().trim().length(6),
  /** Accepted for OtpVerification compatibility; ignored — pendingEmail is source of truth. */
  email: z.string().email().optional(),
  purpose: z.literal("EMAIL_CHANGE").optional(),
});

/** Confirm EMAIL_CHANGE OTP and apply the new address. */
export async function POST(request: Request) {
  const session = await requireSessionUser();
  if (!isSessionUser(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "أدخل رمز التحقق المكوّن من 6 أرقام." },
      { status: 400 },
    );
  }

  const result = await confirmEmailChange({
    userId: session.id,
    code: parsed.data.code,
  });

  if (!result.ok) {
    const status =
      result.error === "INVALID_OTP"
        ? 400
        : result.error === "NO_PENDING"
          ? 409
          : result.error === "EMAIL_TAKEN"
            ? 409
            : 400;
    return NextResponse.json(
      {
        error: result.error,
        message: result.message,
        ...(typeof result.attemptsRemaining === "number"
          ? { attemptsRemaining: result.attemptsRemaining }
          : {}),
      },
      { status },
    );
  }

  await setSessionCookie(result.user);
  return NextResponse.json({
    ok: true,
    user: result.user,
    message: "تم تحديث بريدك الإلكتروني بنجاح.",
  });
}
