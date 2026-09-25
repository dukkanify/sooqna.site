import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/services/auth/session-cookie";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import { updateUserProfile } from "@/services/auth/user-store";

const accountTypes = [
  "buyer",
  "seller",
  "business",
  "individual",
  "company",
] as const;

const profilePatchSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().default(""),
  city: z.string().trim().min(1).max(80),
  accountType: z.enum(accountTypes),
});

/** Authenticated self-service profile update — persists to user store + refreshes session. */
export async function PATCH(request: Request) {
  const user = await requireSessionUser();
  if (!isSessionUser(user)) return user;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const updated = await updateUserProfile(user.id, parsed.data);
  if (!updated) {
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }

  await setSessionCookie(updated);
  return NextResponse.json({ user: updated });
}
