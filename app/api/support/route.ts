import { NextResponse } from "next/server";
import { z } from "zod";
import { BRAND } from "@/shared/constants/brand";
import { deliverEmailSafely } from "@/services/email/email.service";
import { checkRateLimit, getClientIp } from "@/services/auth/rate-limit";
import { getValidSessionUser } from "@/services/auth/require-session";
import { getAllUsers } from "@/services/auth/user-store";
import { createNotification } from "@/services/payments/notification-store";
import { createSupportMessage } from "@/services/support/support-message-store";
import {
  SUPPORT_MESSAGE_STATUS_LABELS,
  SUPPORT_TOPIC_LABELS,
} from "@/types/domain/support-message";
import { getAppUrl } from "@/shared/constants/site";

const schema = z.object({
  name: z.string().trim().min(2, "NAME_TOO_SHORT").max(80, "NAME_TOO_LONG"),
  email: z.string().trim().email("EMAIL_INVALID"),
  topic: z.enum(["order", "listing", "escrow", "account", "other"], {
    message: "TOPIC_INVALID",
  }),
  message: z
    .string()
    .trim()
    .min(10, "MESSAGE_TOO_SHORT")
    .max(2000, "MESSAGE_TOO_LONG"),
});

const fieldMessages: Record<string, string> = {
  NAME_TOO_SHORT: "الاسم يجب أن يكون حرفين على الأقل.",
  NAME_TOO_LONG: "الاسم طويل جداً.",
  EMAIL_INVALID: "البريد الإلكتروني غير صالح.",
  TOPIC_INVALID: "اختر موضوعاً صالحاً.",
  MESSAGE_TOO_SHORT: "الرسالة يجب أن تكون 10 أحرف على الأقل.",
  MESSAGE_TOO_LONG: "الرسالة طويلة جداً.",
};

function appOrigin(request: Request): string {
  try {
    return getAppUrl();
  } catch {
    return new URL(request.url).origin;
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`support:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "محاولات كثيرة. حاول بعد قليل." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      const code = issue.message;
      if (!fieldErrors[key]) {
        fieldErrors[key] = fieldMessages[code] ?? issue.message;
      }
    }
    return NextResponse.json(
      {
        error: "INVALID_INPUT",
        message: "أكمل الحقول المطلوبة بشكل صحيح.",
        fieldErrors,
      },
      { status: 400 },
    );
  }

  const sessionUser = await getValidSessionUser();
  const topic = SUPPORT_TOPIC_LABELS[parsed.data.topic];
  const origin = appOrigin(request);

  const saved = await createSupportMessage({
    name: parsed.data.name,
    email: parsed.data.email,
    topic: parsed.data.topic,
    message: parsed.data.message,
    userId: sessionUser?.id,
  });

  const trackPath = `/support/track?ticket=${encodeURIComponent(saved.ticketNumber)}`;
  const trackUrl = `${origin}${trackPath}`;

  const admins = (await getAllUsers()).filter((user) => user.role === "admin");
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "support_message",
        title: "طلب تواصل جديد",
        body: `${saved.ticketNumber} — ${saved.name} — ${topic}`,
        href: "/admin/support-messages",
      }),
    ),
  );

  if (sessionUser?.id) {
    await createNotification({
      userId: sessionUser.id,
      type: "support_message",
      title: "استلمنا طلب التواصل",
      body: `رقم الطلب ${saved.ticketNumber} — الحالة: ${SUPPORT_MESSAGE_STATUS_LABELS.received}`,
      href: "/profile#support-tickets",
    });
  }

  const inbox = process.env.SUPPORT_EMAIL?.trim() || BRAND.supportEmail;
  const subject = `طلب دعم ${saved.ticketNumber} — ${topic} — ${parsed.data.name}`;
  const text = [
    `رقم الطلب: ${saved.ticketNumber}`,
    `الاسم: ${parsed.data.name}`,
    `البريد: ${parsed.data.email}`,
    `الموضوع: ${topic}`,
    `الحالة: ${SUPPORT_MESSAGE_STATUS_LABELS.received}`,
    `المعرّف الداخلي: ${saved.id}`,
    "",
    parsed.data.message,
  ].join("\n");

  const safeMessage = parsed.data.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  const emailed = await deliverEmailSafely({
    eventType: "support_inbox",
    to: inbox,
    subject,
    text,
    html: `<div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;"><p><strong>${parsed.data.name}</strong><br/>${parsed.data.email}</p><p>رقم الطلب: <strong dir="ltr">${saved.ticketNumber}</strong></p><p>الموضوع: ${topic}</p><p>${safeMessage}</p><p style="color:#666;font-size:12px;">لوحة التحكم: /admin/support-messages</p></div>`,
  });

  await deliverEmailSafely({
    eventType: "support_ack",
    to: parsed.data.email,
    subject: `طلبك ${saved.ticketNumber} — ${BRAND.nameAr}`,
    text: [
      `مرحبًا ${parsed.data.name}،`,
      ``,
      `استلمنا رسالتك حول «${topic}».`,
      `رقم الطلب للمتابعة: ${saved.ticketNumber}`,
      `الحالة الحالية: ${SUPPORT_MESSAGE_STATUS_LABELS.received}`,
      ``,
      `تابع الحالة من هنا:`,
      trackUrl,
      ``,
      `احتفظ برقم الطلب والبريد الذي أرسلت منه للتحقق.`,
      `فريق ${BRAND.nameAr}`,
    ].join("\n"),
    html: `<div style="font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;line-height:1.8;"><p>مرحبًا ${parsed.data.name}،</p><p>استلمنا رسالتك حول «${topic}».</p><p>رقم الطلب للمتابعة: <strong dir="ltr">${saved.ticketNumber}</strong></p><p>الحالة الحالية: ${SUPPORT_MESSAGE_STATUS_LABELS.received}</p><p><a href="${trackUrl}">متابعة حالة الطلب</a></p><p style="color:#666;font-size:13px;">احتفظ برقم الطلب والبريد الذي أرسلت منه للتحقق.</p><p>فريق ${BRAND.nameAr}</p></div>`,
  });

  return NextResponse.json({
    ok: true,
    emailed,
    messageId: saved.id,
    ticketNumber: saved.ticketNumber,
    status: saved.status,
    statusLabel: SUPPORT_MESSAGE_STATUS_LABELS[saved.status],
    trackPath,
    adminPath: "/admin/support-messages",
  });
}
