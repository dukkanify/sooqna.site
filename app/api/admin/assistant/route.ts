import { NextResponse } from "next/server";
import {
  isSessionUser,
  requireAdminUser,
} from "@/services/auth/require-session";
import {
  answerAdminAssistantQuery,
  getAdminAssistantArticle,
} from "@/services/admin/assistant.service";
import { ADMIN_ASSISTANT_SUGGESTIONS } from "@/services/admin/assistant-knowledge";

export const runtime = "nodejs";

type Body = {
  message?: unknown;
  articleId?: unknown;
};

export async function GET() {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) return admin;

  return NextResponse.json({
    suggestions: ADMIN_ASSISTANT_SUGGESTIONS,
    ok: true,
  });
}

export async function POST(request: Request) {
  const admin = await requireAdminUser();
  if (!isSessionUser(admin)) return admin;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  if (typeof body.articleId === "string" && body.articleId.trim()) {
    const article = getAdminAssistantArticle(body.articleId.trim());
    if (!article) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({
      answer: `${article.summary}\n\nالخطوات:\n${article.steps
        .map((step, index) => `${index + 1}. ${step}`)
        .join("\n")}`,
      articleId: article.id,
      links: article.links,
      related: [],
      mode: "knowledge" as const,
    });
  }

  const message = typeof body.message === "string" ? body.message : "";
  if (message.trim().length > 800) {
    return NextResponse.json({ error: "MESSAGE_TOO_LONG" }, { status: 400 });
  }

  const reply = answerAdminAssistantQuery(message);
  return NextResponse.json(reply);
}
