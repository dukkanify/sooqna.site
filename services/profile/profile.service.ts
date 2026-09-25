import { redirect } from "next/navigation";
import type { UserProfile } from "@/types";
import { getValidSessionUser } from "@/services/auth/require-session";
import { updateUserProfile } from "@/services/auth/user-store";

/** Session user from signed cookie + DB — null when guest. */
export async function getCurrentUser(): Promise<UserProfile | null> {
  return getValidSessionUser();
}

/** Require a logged-in user or redirect to login. */
export async function requireCurrentUser(nextPath: string): Promise<UserProfile> {
  const user = await getValidSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/** Persist profile fields for the signed-in user (server actions / forms). */
export async function updateUserProfileDraft(
  userId: string,
  payload: Partial<UserProfile>,
): Promise<UserProfile | null> {
  const session = await getValidSessionUser();
  if (!session || session.id !== userId) return session;

  return updateUserProfile(userId, {
    fullName: payload.fullName,
    phone: payload.phone,
    city: payload.city,
    accountType: payload.accountType,
  });
}
