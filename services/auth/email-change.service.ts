import { verifyPassword } from "@/services/auth/password.service";
import {
  applyEmailChange,
  findUserByEmail,
  findUserById,
  normalizeAuthEmail,
  setPendingEmail,
} from "@/services/auth/user-store";
import { sendOtpForPurpose } from "@/services/auth/auth-handlers";
import { verifyOtpCode } from "@/services/otp/otp.service";
import { canRevealOtpToClient } from "@/services/otp/otp-config";
import { maskEmail } from "@/shared/utils/mask-email";
import type { UserProfile } from "@/types";

export type EmailChangeRequestResult =
  | {
      ok: true;
      pendingEmail: string;
      maskedEmail: string;
      emailDelivered: boolean;
      otp?: string;
      user: UserProfile;
    }
  | {
      ok: false;
      error:
        | "NOT_FOUND"
        | "INVALID_EMAIL"
        | "SAME_EMAIL"
        | "EMAIL_TAKEN"
        | "AUTH_REQUIRED"
        | "INVALID_PASSWORD"
        | "INVALID_REAUTH"
        | "EMAIL_SEND_FAILED";
      message: string;
    };

export type EmailChangeConfirmResult =
  | { ok: true; user: UserProfile }
  | {
      ok: false;
      error:
        | "NOT_FOUND"
        | "NO_PENDING"
        | "INVALID_OTP"
        | "EMAIL_TAKEN"
        | "INVALID_EMAIL";
      message: string;
      attemptsRemaining?: number;
    };

function isValidEmailShape(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Re-auth with password (preferred) or OTP sent to the current email,
 * then send EMAIL_CHANGE OTP to the new address without applying it yet.
 */
export async function requestEmailChange(input: {
  userId: string;
  newEmail: string;
  password?: string;
  reauthCode?: string;
}): Promise<EmailChangeRequestResult> {
  const user = await findUserById(input.userId);
  if (!user) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "تعذر العثور على الحساب.",
    };
  }

  const newEmail = normalizeAuthEmail(input.newEmail);
  if (!isValidEmailShape(newEmail)) {
    return {
      ok: false,
      error: "INVALID_EMAIL",
      message: "أدخل بريداً إلكترونياً صالحاً.",
    };
  }

  if (newEmail === normalizeAuthEmail(user.email)) {
    return {
      ok: false,
      error: "SAME_EMAIL",
      message: "هذا هو بريدك الحالي. أدخل بريداً مختلفاً.",
    };
  }

  const taken = await findUserByEmail(newEmail);
  if (taken && taken.id !== user.id) {
    return {
      ok: false,
      error: "EMAIL_TAKEN",
      message: "هذا البريد مستخدم لحساب آخر.",
    };
  }

  const password = input.password?.trim() ?? "";
  const reauthCode = input.reauthCode?.trim() ?? "";
  const hasPassword = Boolean(user.passwordHash);

  if (password) {
    if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return {
        ok: false,
        error: "INVALID_PASSWORD",
        message: "كلمة المرور غير صحيحة.",
      };
    }
  } else if (reauthCode) {
    const reauth = await verifyOtpCode({
      email: user.email,
      code: reauthCode,
      purpose: "SENSITIVE_ACTION",
    });
    if (!reauth.ok) {
      return {
        ok: false,
        error: "INVALID_REAUTH",
        message: "رمز التحقق على بريدك الحالي غير صحيح أو منتهٍ.",
      };
    }
  } else if (hasPassword) {
    return {
      ok: false,
      error: "AUTH_REQUIRED",
      message: "أدخل كلمة المرور لتأكيد تغيير البريد.",
    };
  } else {
    return {
      ok: false,
      error: "AUTH_REQUIRED",
      message: "أكد هويتك برمز يُرسل إلى بريدك الحالي أولاً.",
    };
  }

  const profile = await setPendingEmail(user.id, newEmail);
  if (!profile) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "تعذر حفظ طلب تغيير البريد.",
    };
  }

  try {
    const sent = await sendOtpForPurpose({
      email: newEmail,
      fullName: user.fullName,
      purpose: "EMAIL_CHANGE",
      userId: user.id,
      metadata: {
        userId: user.id,
        previousEmail: normalizeAuthEmail(user.email),
        newEmail,
      },
    });

    return {
      ok: true,
      pendingEmail: newEmail,
      maskedEmail: maskEmail(newEmail),
      emailDelivered: sent.delivered,
      ...(canRevealOtpToClient(sent.delivered) ? { otp: sent.code } : {}),
      user: profile,
    };
  } catch {
    await setPendingEmail(user.id, null);
    return {
      ok: false,
      error: "EMAIL_SEND_FAILED",
      message: "تعذر إرسال رمز التحقق إلى البريد الجديد. حاول مرة أخرى.",
    };
  }
}

export async function confirmEmailChange(input: {
  userId: string;
  code: string;
}): Promise<EmailChangeConfirmResult> {
  const user = await findUserById(input.userId);
  if (!user) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "تعذر العثور على الحساب.",
    };
  }

  const pending = user.pendingEmail?.trim()
    ? normalizeAuthEmail(user.pendingEmail)
    : "";
  if (!pending) {
    return {
      ok: false,
      error: "NO_PENDING",
      message: "لا يوجد طلب تغيير بريد بانتظار التأكيد.",
    };
  }

  const verified = await verifyOtpCode({
    email: pending,
    code: input.code.trim(),
    purpose: "EMAIL_CHANGE",
  });
  if (!verified.ok) {
    return {
      ok: false,
      error: "INVALID_OTP",
      message: "رمز التحقق غير صحيح أو منتهٍ.",
      attemptsRemaining: verified.attemptsRemaining,
    };
  }

  const applied = await applyEmailChange(user.id, pending);
  if (!applied.ok) {
    return {
      ok: false,
      error: applied.error,
      message:
        applied.error === "EMAIL_TAKEN"
          ? "هذا البريد أصبح مستخدماً. ابدأ الطلب من جديد."
          : "تعذر اعتماد البريد الجديد.",
    };
  }

  return { ok: true, user: applied.user };
}

export async function resendEmailChangeOtp(userId: string): Promise<
  | {
      ok: true;
      pendingEmail: string;
      emailDelivered: boolean;
      otp?: string;
    }
  | { ok: false; error: "NOT_FOUND" | "NO_PENDING" | "EMAIL_SEND_FAILED"; message: string }
> {
  const user = await findUserById(userId);
  if (!user) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "تعذر العثور على الحساب.",
    };
  }
  const pending = user.pendingEmail?.trim()
    ? normalizeAuthEmail(user.pendingEmail)
    : "";
  if (!pending) {
    return {
      ok: false,
      error: "NO_PENDING",
      message: "لا يوجد طلب تغيير بريد بانتظار التأكيد.",
    };
  }

  try {
    const sent = await sendOtpForPurpose({
      email: pending,
      fullName: user.fullName,
      purpose: "EMAIL_CHANGE",
      userId: user.id,
      metadata: {
        userId: user.id,
        previousEmail: normalizeAuthEmail(user.email),
        newEmail: pending,
      },
    });
    return {
      ok: true,
      pendingEmail: pending,
      emailDelivered: sent.delivered,
      ...(canRevealOtpToClient(sent.delivered) ? { otp: sent.code } : {}),
    };
  } catch {
    return {
      ok: false,
      error: "EMAIL_SEND_FAILED",
      message: "تعذر إعادة إرسال الرمز. حاول لاحقاً.",
    };
  }
}

export async function sendEmailChangeReauthOtp(userId: string): Promise<
  | {
      ok: true;
      email: string;
      emailDelivered: boolean;
      otp?: string;
    }
  | { ok: false; error: "NOT_FOUND" | "EMAIL_SEND_FAILED"; message: string }
> {
  const user = await findUserById(userId);
  if (!user) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "تعذر العثور على الحساب.",
    };
  }
  try {
    const sent = await sendOtpForPurpose({
      email: user.email,
      fullName: user.fullName,
      purpose: "SENSITIVE_ACTION",
      userId: user.id,
      metadata: { action: "email_change_reauth" },
    });
    return {
      ok: true,
      email: user.email,
      emailDelivered: sent.delivered,
      ...(canRevealOtpToClient(sent.delivered) ? { otp: sent.code } : {}),
    };
  } catch {
    return {
      ok: false,
      error: "EMAIL_SEND_FAILED",
      message: "تعذر إرسال رمز التحقق إلى بريدك الحالي.",
    };
  }
}
