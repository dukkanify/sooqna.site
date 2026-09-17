import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AUTH_STORE_UNAVAILABLE_MESSAGE,
  PASSWORD_RESET_EXPIRED_MESSAGE,
  PASSWORD_RESET_INVALID_MESSAGE,
  PASSWORD_RESET_NOT_DURABLE_MESSAGE,
  PASSWORD_RESET_SUCCESS_MESSAGE,
} from "@/services/auth/auth-messages";
import {
  markPasswordResetTokenConsumed,
  passwordFingerprint,
  resolvePasswordResetToken,
  inspectPasswordResetToken,
} from "@/services/auth/password-reset-token";
import {
  hashPassword,
  isStrongPassword,
  verifyPassword,
} from "@/services/auth/password.service";
import { STRONG_PASSWORD_HINT } from "@/shared/utils/password-rules";
import { clearSessionCookie } from "@/services/auth/session-cookie";
import { completePersonVerification } from "@/services/auth/signup-approval";
import { findUserById, setUserPassword } from "@/services/auth/user-store";
import {
  AuthStoreError,
  requireDurableAuthStore,
} from "@/services/auth/user-persistence";

const confirmSchema = z.object({
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
  token: z.string().min(16),
});

function tokenErrorResponse(status: "expired" | "invalid") {
  if (status === "expired") {
    return NextResponse.json(
      { error: "TOKEN_EXPIRED", message: PASSWORD_RESET_EXPIRED_MESSAGE },
      { status: 400 },
    );
  }
  return NextResponse.json(
    { error: "INVALID_TOKEN", message: PASSWORD_RESET_INVALID_MESSAGE },
    { status: 400 },
  );
}

export async function GET(request: Request) {
  const { normalizePasswordResetToken } = await import(
    "@/services/auth/password-reset-token"
  );
  const token = normalizePasswordResetToken(
    new URL(request.url).searchParams.get("token"),
  );
  const status = await inspectPasswordResetToken(token);
  if (status === "valid") {
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  const response = tokenErrorResponse(status);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: PASSWORD_RESET_INVALID_MESSAGE },
        { status: 400 },
      );
    }

    const newPassword = parsed.data.newPassword.trim();
    const confirmPassword = parsed.data.confirmPassword.trim();
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "PASSWORD_MISMATCH", message: "كلمتا المرور غير متطابقتين." },
        { status: 400 },
      );
    }

    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        { error: "WEAK_PASSWORD", message: STRONG_PASSWORD_HINT },
        { status: 400 },
      );
    }

    // Resolve without burning — only consume after a durable write is verified.
    const { normalizePasswordResetToken } = await import(
      "@/services/auth/password-reset-token"
    );
    const resolved = await resolvePasswordResetToken(
      normalizePasswordResetToken(parsed.data.token),
    );
    if (!resolved.ok) {
      return tokenErrorResponse(resolved.status);
    }

    try {
      await requireDurableAuthStore();
    } catch (error) {
      if (error instanceof AuthStoreError) {
        return NextResponse.json(
          {
            error: "AUTH_STORE_NOT_DURABLE",
            message: PASSWORD_RESET_NOT_DURABLE_MESSAGE,
          },
          { status: 503 },
        );
      }
      throw error;
    }

    const user = await findUserById(resolved.userId);
    if (!user) {
      return tokenErrorResponse("invalid");
    }

    if (
      resolved.passwordFingerprint &&
      passwordFingerprint(user.passwordHash) !== resolved.passwordFingerprint
    ) {
      return tokenErrorResponse("invalid");
    }

    const passwordHash = hashPassword(newPassword);
    await setUserPassword(user.id, passwordHash);

    // Prove the durable store accepts the new password before burning the token.
    const reloaded = await findUserById(user.id);
    if (!reloaded?.passwordHash || !verifyPassword(newPassword, reloaded.passwordHash)) {
      return NextResponse.json(
        {
          error: "PASSWORD_PERSIST_FAILED",
          message: PASSWORD_RESET_NOT_DURABLE_MESSAGE,
        },
        { status: 503 },
      );
    }

    // Clicking the reset link already proves email ownership — never force
    // REGISTER OTP after password recovery. OTP remains for first-time signup only.
    if (!user.emailVerifiedAt) {
      try {
        await completePersonVerification(user.id);
      } catch (error) {
        console.error(
          "[Sooqna Auth] password reset email verification failed",
          error,
        );
      }
    }

    await markPasswordResetTokenConsumed(resolved.jti);
    await clearSessionCookie();

    return NextResponse.json({
      ok: true,
      message: PASSWORD_RESET_SUCCESS_MESSAGE,
    });
  } catch (error) {
    if (error instanceof AuthStoreError) {
      const notDurable = error.message === "AUTH_STORE_NOT_DURABLE";
      return NextResponse.json(
        {
          error: notDurable ? "AUTH_STORE_NOT_DURABLE" : "AUTH_STORE_UNAVAILABLE",
          message: notDurable
            ? PASSWORD_RESET_NOT_DURABLE_MESSAGE
            : AUTH_STORE_UNAVAILABLE_MESSAGE,
        },
        { status: 503 },
      );
    }
    console.error("[Sooqna Auth] password reset confirm failed", error);
    return NextResponse.json(
      {
        error: "PASSWORD_RESET_FAILED",
        message: "تعذر تحديث كلمة المرور حاليًا. حاول مرة أخرى.",
      },
      { status: 500 },
    );
  }
}
