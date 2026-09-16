import {
  isSessionUser,
} from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import {
  approvePendingUser,
  completePersonVerification,
} from "@/services/auth/signup-approval";
import { sendRegistrationVerifyOtp } from "@/services/auth/auth-handlers";
import { issuePasswordResetToken } from "@/services/auth/password-reset-token";
import { emailPasswordResetLink } from "@/services/email/notification-emails";
import {
  findUserById,
  toAdminUserRecord,
  updateUserAdmin,
} from "@/services/auth/user-store";
import { getAllListings } from "@/services/listings/listing-store";
import type { AdminUserPatch } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteParams) {
  const admin = await requireAdminPermission("users", "edit");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const { id } = await context.params;
  const body = (await request.json()) as AdminUserPatch;
  const current = await findUserById(id);
  if (!current) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const actorIsSuper =
    !admin.adminPermissions || admin.adminPermissions.length === 0;
  const targetIsSuper =
    current.role === "admin" &&
    (!current.adminPermissions || current.adminPermissions.length === 0);

  // Sub-admins cannot modify super admins.
  if (!actorIsSuper && targetIsSuper) {
    return NextResponse.json({ error: "CANNOT_MODIFY_SUPER_ADMIN" }, { status: 403 });
  }

  // Prevent self-escalation to full super admin or broader modules.
  if (admin.id === id && body.adminPermissions) {
    const currentPerms = new Set(admin.adminPermissions ?? []);
    const nextPerms = body.adminPermissions;
    const expandingToSuper = nextPerms.length === 0 && currentPerms.size > 0;
    const addingModules = nextPerms.some((item) => !currentPerms.has(item));
    if (expandingToSuper || (currentPerms.size > 0 && addingModules)) {
      return NextResponse.json({ error: "SELF_ESCALATION" }, { status: 403 });
    }
  }

  // Only super admins may change roles or module permissions.
  if (
    !actorIsSuper &&
    (body.role !== undefined ||
      body.adminPermissions !== undefined ||
      body.adminActionMatrix !== undefined)
  ) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const listings = await getAllListings();
  const listingsCount = listings.filter((item) => item.seller.id === id).length;

  if (body.recoveryAction === "force_verify") {
    const { approved, user } = await completePersonVerification(id);
    await logAdminAction({
      actorId: admin.id,
      actorName: admin.fullName,
      action: "user_update",
      targetType: "user",
      targetId: id,
      detail: approved
        ? "تحقق يدوي + اعتماد تلقائي"
        : "تحقق يدوي من البريد",
    });
    return NextResponse.json({
      user: toAdminUserRecord(user, listingsCount),
      recovery: { action: "force_verify", approved },
    });
  }

  if (body.recoveryAction === "resend_verification") {
    if (current.emailVerifiedAt) {
      return NextResponse.json(
        {
          error: "ALREADY_VERIFIED",
          message: "الحساب متحقّق مسبقاً.",
        },
        { status: 400 },
      );
    }
    const sent = await sendRegistrationVerifyOtp({
      email: current.email,
      fullName: current.fullName,
      userId: current.id,
      accountType: current.accountType ?? "individual",
    });
    await logAdminAction({
      actorId: admin.id,
      actorName: admin.fullName,
      action: "user_update",
      targetType: "user",
      targetId: id,
      detail: sent.delivered
        ? "إعادة إرسال رمز التحقق"
        : "إعادة إرسال رمز التحقق (تعذّر التسليم)",
    });
    return NextResponse.json({
      user: toAdminUserRecord(current, listingsCount),
      recovery: {
        action: "resend_verification",
        delivered: sent.delivered,
      },
    });
  }

  if (body.recoveryAction === "send_password_reset") {
    if (!current.passwordHash) {
      return NextResponse.json(
        {
          error: "NO_PASSWORD",
          message: "هذا الحساب يدخل برمز OTP وليس بكلمة مرور.",
        },
        { status: 400 },
      );
    }
    const rawToken = await issuePasswordResetToken({
      email: current.email,
      userId: current.id,
      passwordHash: current.passwordHash,
    });
    try {
      await emailPasswordResetLink({
        email: current.email,
        name: current.fullName,
        token: rawToken,
      });
    } catch (error) {
      console.error("[Sooqna Admin] password reset email failed", error);
      return NextResponse.json(
        {
          error: "EMAIL_FAILED",
          message: "تعذر إرسال رابط إعادة كلمة المرور.",
        },
        { status: 502 },
      );
    }
    await logAdminAction({
      actorId: admin.id,
      actorName: admin.fullName,
      action: "user_update",
      targetType: "user",
      targetId: id,
      detail: "إرسال رابط إعادة كلمة المرور",
    });
    return NextResponse.json({
      user: toAdminUserRecord(current, listingsCount),
      recovery: { action: "send_password_reset", delivered: true },
    });
  }

  if (body.accountStatus === "active" && current.accountStatus === "pending") {
    if (!current.emailVerifiedAt) {
      return NextResponse.json(
        {
          error: "PERSON_NOT_VERIFIED",
          message: "تحقق من الشخص أولاً قبل اعتماد الحساب.",
        },
        { status: 400 },
      );
    }
    await approvePendingUser(id);
  }

  const patch: AdminUserPatch = { ...body };
  delete patch.recoveryAction;
  const user = await updateUserAdmin(id, patch);
  if (!user) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await logAdminAction({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "user_update",
    targetType: "user",
    targetId: id,
    detail: [
      body.accountStatus ? `حالة ${body.accountStatus}` : null,
      typeof body.isVerified === "boolean"
        ? body.isVerified
          ? "توثيق"
          : "إلغاء توثيق"
        : null,
      body.role ? `دور ${body.role}` : null,
      body.adminPermissions
        ? `صلاحيات: ${
            body.adminPermissions.length === 0
              ? "مدير أعلى"
              : body.adminPermissions.join(",")
          }`
        : null,
      body.adminActionMatrix ? "مصفوفة إجراءات محدّثة" : null,
    ]
      .filter(Boolean)
      .join(" · "),
  });

  return NextResponse.json({ user: toAdminUserRecord(user, listingsCount) });
}
