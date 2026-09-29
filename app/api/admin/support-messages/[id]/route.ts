import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/services/admin/admin-audit-store";
import {
  getSupportMessageById,
  patchSupportMessage,
} from "@/services/support/support-message-store";

const schema = z.object({
  status: z.enum(["open", "reviewed", "resolved", "dismissed"]),
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
      parsed.data.status === "open"
        ? undefined
        : new Date().toISOString(),
    resolvedByName:
      parsed.data.status === "open" ? undefined : admin.fullName,
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
      `رسالة من ${existing.name}`,
      `حالة ${parsed.data.status}`,
      note ? `ملاحظة: ${note}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  });

  return NextResponse.json({ ok: true, message: updated });
}
