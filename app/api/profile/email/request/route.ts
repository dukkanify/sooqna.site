import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enforceRateLimit,
  otpCooldownResponse,
} from "@/services/auth/auth-handlers";
import { requestEmailChange } from "@/services/auth/email-change.service";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import { setSessionCookie } from "@/services/auth/session-cookie";

const schema = z.object({
  newEmail: z.string().trim().email().max(200),
  password: z.string().max(200).optional(),
  reauthCode: z.string().trim().length(6).optional(),
});

/** Start email change: re-auth (password or current-email OTP), then OTP to new email. */
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
      { error: "INVALID_INPUT", message: "أدخل بريداً إلكترونياً صالحاً." },
      { status: 400 },
    );
  }

  if (!(await enforceRateLimit(request, parsed.data.newEmail))) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: "محاولات كثيرة. حاول بعد قليل.",
      },
      { status: 429 },
    );
  }

  try {
    const result = await requestEmailChange({
      userId: session.id,
      newEmail: parsed.data.newEmail,
      password: parsed.data.password,
      reauthCode: parsed.data.reauthCode,
    });

    if (!result.ok) {
      const status =
        result.error === "INVALID_PASSWORD" ||
        result.error === "INVALID_REAUTH" ||
        result.error === "AUTH_REQUIRED"
          ? 401
          : result.error === "EMAIL_TAKEN" || result.error === "SAME_EMAIL"
            ? 409
            : result.error === "EMAIL_SEND_FAILED"
              ? 503
              : 400;
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status },
      );
    }

    await setSessionCookie(result.user);
    return NextResponse.json({
      ok: true,
      pendingEmail: result.pendingEmail,
      maskedEmail: result.maskedEmail,
      emailDelivered: result.emailDelivered,
      user: result.user,
      message: "أرسلنا رمز تحقق إلى البريد الجديد. أكّده قبل اعتماد التغيير.",
      ...(result.otp ? { otp: result.otp } : {}),
    });
  } catch (error) {
    const cooldown = otpCooldownResponse(error);
    if (cooldown) return cooldown;
    return NextResponse.json(
      {
        error: "EMAIL_SEND_FAILED",
        message: "تعذر إرسال رمز التحقق إلى البريد الجديد.",
      },
      { status: 503 },
    );
  }
}
