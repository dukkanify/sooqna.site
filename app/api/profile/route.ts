import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/services/auth/session-cookie";
import {
  isSessionUser,
  requireSessionUser,
} from "@/services/auth/require-session";
import { updateUserProfile } from "@/services/auth/user-store";
import { SOCIAL_LINK_PLATFORMS } from "@/shared/constants/social-links";
import { sanitizeSocialLinks } from "@/shared/validation/social-links";

const accountTypes = [
  "buyer",
  "seller",
  "business",
  "individual",
  "company",
] as const;

const socialLinksSchema = z
  .object(
    Object.fromEntries(
      SOCIAL_LINK_PLATFORMS.map((platform) => [
        platform,
        z.string().trim().max(200).optional(),
      ]),
    ) as Record<(typeof SOCIAL_LINK_PLATFORMS)[number], z.ZodOptional<z.ZodString>>,
  )
  .partial()
  .optional();

const profilePatchSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().default(""),
  city: z.string().trim().min(1).max(80),
  accountType: z.enum(accountTypes),
  socialLinks: socialLinksSchema,
  socialLinksPublic: z.boolean().optional(),
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

  const hasSocialLinks = Object.prototype.hasOwnProperty.call(
    parsed.data,
    "socialLinks",
  );
  let socialLinks = parsed.data.socialLinks;
  if (hasSocialLinks) {
    const sanitized = sanitizeSocialLinks(parsed.data.socialLinks);
    if (!sanitized.ok) {
      return NextResponse.json(
        {
          error: "INVALID_SOCIAL_LINK",
          platform: sanitized.platform,
          message: sanitized.message,
        },
        { status: 400 },
      );
    }
    socialLinks = sanitized.links;
  }

  const updated = await updateUserProfile(user.id, {
    fullName: parsed.data.fullName,
    phone: parsed.data.phone,
    city: parsed.data.city,
    accountType: parsed.data.accountType,
    ...(hasSocialLinks ? { socialLinks } : {}),
    ...(parsed.data.socialLinksPublic !== undefined
      ? { socialLinksPublic: parsed.data.socialLinksPublic }
      : {}),
  });
  if (!updated) {
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }

  await setSessionCookie(updated);
  return NextResponse.json({ user: updated });
}
