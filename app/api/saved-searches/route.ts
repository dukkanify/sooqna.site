import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import {
  listSavedSearchesForUser,
  removeSavedSearchForUser,
  upsertSavedSearch,
} from "@/services/saved-searches/saved-search-store";

const upsertSchema = z.object({
  label: z.string().min(1).max(120),
  url: z.string().min(1).max(500),
  query: z.string().max(200).optional(),
  categoryId: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
});

export async function GET() {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;
  const items = await listSavedSearchesForUser(user.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const item = await upsertSavedSearch({
    userId: user.id,
    ...parsed.data,
  });
  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  await removeSavedSearchForUser(user.id, id);
  return NextResponse.json({ ok: true });
}
