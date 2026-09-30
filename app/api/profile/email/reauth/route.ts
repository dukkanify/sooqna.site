import { NextResponse } from "next/server";
import {
  enforceRateLimit,
  genericOtpResponse,
  otpCooldownResponse,
} from "@/services/auth/auth-handlers";
import { sendEmailChangeReauthOtp } from "@/services/auth/email-change.service";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";

/** Send OTP to the current email to authorize an email change (passwordless users). */
export async function POST(request: Request) {
  const session = await requireSessionUser();
  if (!isSessionUser(session)) return session;

  if (!(await enforceRateLimit(request, session.email))) {
    return genericOtpResponse(session.email);
  }

  try {
    const result = await sendEmailChangeReauthOtp(session.id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.error === "EMAIL_SEND_FAILED" ? 503 : 400 },
      );
    }
    return genericOtpResponse(result.email, {
      emailDelivered: result.emailDelivered,
      ...(result.otp ? { otp: result.otp, revealOtp: true } : {}),
    });
  } catch (error) {
    const cooldown = otpCooldownResponse(error);
    if (cooldown) return cooldown;
    return NextResponse.json(
      {
        error: "EMAIL_SEND_FAILED",
        message: "تعذر إرسال رمز التحقق إلى بريدك الحالي.",
      },
      { status: 503 },
    );
  }
}
