import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { z } from "zod";
import { BRAND } from "@/shared/constants/brand";
import { getAppUrl } from "@/shared/constants/site";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import { deliverEmailSafely } from "@/services/email/email.service";
import { createNotification } from "@/services/payments/notification-store";
import {
  getSupportMessageById,
  patchSupportMessage,
} from "@/services/support/support-message-store";
import { SUPPORT_MESSAGE_STATUS_LABELS } from "@/types/domain/support-message";

const schema = z.object({
  status: z.enum(["received", "in_review", "replied", "closed"]),
  resolutionNote: z.string().max(1000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminPermission("listings", "edit");
  if (!isSessionUser(admin)) {
    return admin;
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const existing = await getSupportMessageById(id);
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const note = parsed.data.resolutionNote?.trim();
  const updated = await patchSupportMessage(id, {
    status: parsed.data.status,
    resolutionNote: note || existing.resolutionNote,
    resolvedAt:
      parsed.data.status === "received"
        ? undefined
        : new Date().toISOString(),
    resolvedByName:
      parsed.data.status === "received" ? undefined : admin.fullName,
  });

  if (!updated) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  await logAdminAction({
    actorId: admin.id,
    actorName: admin.fullName,
    action: "support_message_update",
    targetType: "support_message",
    targetId: id,
    detail: [
      `طلب ${existing.ticketNumber}`,
      `من ${existing.name}`,
      `حالة ${SUPPORT_MESSAGE_STATUS_LABELS[parsed.data.status]}`,
      note ? `ملاحظة: ${note}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  });

  if (updated.status !== existing.status || note) {
    const statusLabel = SUPPORT_MESSAGE_STATUS_LABELS[updated.status];
    const trackUrl = `${getAppUrl()}/support/track?ticket=${encodeURIComponent(updated.ticketNumber)}&email=${encodeURIComponent(updated.email)}`;
    await deliverEmailSafely({
      eventType: "support_status",
      to: updated.email,
      subject: `تحديث طلبك ${updated.ticketNumber} — ${statusLabel}`,
      text: [
        `مرحبًا ${updated.name}،`,
        ``,
        `تم تحديث حالة طلب التواصل ${updated.ticketNumber}.`,
        `الحالة الحالية: ${statusLabel}`,
        note ? `ملاحظة الفريق: ${note}` : null,
        ``,
        `المتابعة: ${trackUrl}`,
        `فريق ${BRAND.nameAr}`,
      ]
        .filter(Boolean)
        .join("\n"),
      html: `<div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8;"><p>مرحبًا ${updated.name}،</p><p>تم تحديث حالة طلب التواصل <strong dir="ltr">${updated.ticketNumber}</strong>.</p><p>الحالة الحالية: <strong>${statusLabel}</strong></p>${note ? `<p>ملاحظة الفريق: ${note.replace(/</g, "&lt;")}</p>` : ""}<p><a href="${trackUrl}">متابعة الطلب</a></p><p>فريق ${BRAND.nameAr}</p></div>`,
    });

    if (updated.userId) {
      await createNotification({
        userId: updated.userId,
        type: "support_message",
        title: `تحديث طلب ${updated.ticketNumber}`,
        body: `الحالة: ${statusLabel}`,
        href: "/profile#support-tickets",
      });
    }
  }

  return NextResponse.json({ ok: true, message: updated });
}
