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
import { setSessionCookie } from "@/services/auth/session-cookie";
import {
  applyAdminSetPassword,
  parseAdminNewPassword,
} from "@/services/admin/admin-set-password";
import { getAllListings } from "@/services/listings/listing-store";
import {
  isSuperAdminUser,
  sanitizeAdminActionMatrix,
  sanitizeAdminPermissions,
} from "@/services/auth/admin-permission-checks";
import {
  assignmentFromTemplate,
  type AssignableRoleTemplate,
} from "@/services/auth/permission-matrix";
import type { AdminUserPatch } from "@/types";

const ASSIGNABLE_TEMPLATES = new Set<AssignableRoleTemplate>([
  "content_moderator",
  "finance_admin",
  "support_dispute_admin",
  "read_only_admin",
]);

function isAssignableTemplate(value: unknown): value is AssignableRoleTemplate {
  return (
    typeof value === "string" &&
    ASSIGNABLE_TEMPLATES.has(value as AssignableRoleTemplate)
  );
}

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

  const actorIsSuper = isSuperAdminUser(admin);
  const targetIsSuper = isSuperAdminUser(current);

  // Sub-admins cannot modify super admins.
  if (!actorIsSuper && targetIsSuper) {
    return NextResponse.json({ error: "CANNOT_MODIFY_SUPER_ADMIN" }, { status: 403 });
  }

  if (isAssignableTemplate(body.permissionTemplate)) {
    const assignment = assignmentFromTemplate(body.permissionTemplate);
    body.role = "admin";
    body.adminAccess = "limited";
    body.adminPermissions = assignment.adminPermissions;
    body.adminActionMatrix = assignment.adminActionMatrix;
  } else if (body.permissionTemplate) {
    return NextResponse.json({ error: "INVALID_TEMPLATE" }, { status: 400 });
  }

  if (body.adminAccess === "super") {
    body.role = "admin";
    body.adminPermissions = [];
    body.adminActionMatrix = {};
  } else if (body.adminPermissions !== undefined) {
    const nextRole = body.role ?? current.role ?? "user";
    if (nextRole !== "admin") {
      body.adminPermissions = [];
      body.adminActionMatrix = {};
    } else {
      const sanitized = sanitizeAdminPermissions(body.adminPermissions);
      if (sanitized.length === 0) {
        return NextResponse.json(
          {
            error: "EMPTY_PERMISSIONS",
            message: "اختر صلاحية واحدة على الأقل للمدير الفرعي.",
          },
          { status: 400 },
        );
      }
      body.adminPermissions = sanitized;
      body.adminActionMatrix = sanitizeAdminActionMatrix(
        body.adminActionMatrix,
        sanitized,
      );
      if (body.role === undefined) {
        body.role = "admin";
      }
    }
  }

  const changingAccess =
    body.role !== undefined ||
    body.adminPermissions !== undefined ||
    body.adminActionMatrix !== undefined ||
    body.adminAccess !== undefined ||
    body.permissionTemplate !== undefined;

  // Nobody may rewrite their own access matrix from this desk.
  if (admin.id === id && changingAccess) {
    return NextResponse.json({ error: "SELF_ESCALATION" }, { status: 403 });
  }

  // Another super admin's role / modules stay locked.
  if (targetIsSuper && admin.id !== id && changingAccess) {
    return NextResponse.json({ error: "CANNOT_MODIFY_SUPER_ADMIN" }, { status: 403 });
  }

  // Only super admins may change roles or module permissions.
  if (!actorIsSuper && changingAccess) {
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
      skipCooldown: true,
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

  if (typeof body.newPassword === "string") {
    const parsed = parseAdminNewPassword(body);
    if ("error" in parsed) {
      return NextResponse.json(parsed, { status: 400 });
    }
    const updated = await applyAdminSetPassword({
      actor: admin,
      targetId: id,
      password: parsed.password,
    });
    const stored = await findUserById(id);
    if (!stored) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (admin.id === id) {
      await setSessionCookie(updated);
    }
    return NextResponse.json({
      user: toAdminUserRecord(stored, listingsCount),
      recovery: { action: "set_password" },
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
  delete patch.newPassword;
  delete patch.confirmPassword;
  delete patch.adminAccess;
  delete patch.permissionTemplate;
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
            body.adminAccess === "super" || body.adminPermissions.length === 0
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
