import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/services/auth/rate-limit";
import { lookupSupportTicket } from "@/services/support/support-message-store";

const schema = z.object({
  ticketNumber: z
    .string()
    .trim()
    .min(6, "TICKET_INVALID")
    .max(40, "TICKET_INVALID"),
  email: z.string().trim().email("EMAIL_INVALID"),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const allowed = await checkRateLimit(`support-track:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "محاولات كثيرة. حاول بعد قليل." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_INPUT",
        message: "أدخل رقم الطلب والبريد المستخدم عند الإرسال.",
      },
      { status: 400 },
    );
  }

  const ticket = await lookupSupportTicket({
    ticketNumber: parsed.data.ticketNumber,
    email: parsed.data.email,
  });

  if (!ticket) {
    return NextResponse.json(
      {
        error: "NOT_FOUND",
        message:
          "لم نعثر على طلب بهذه البيانات. تأكد من رقم الطلب والبريد المطابق.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, ticket });
}
