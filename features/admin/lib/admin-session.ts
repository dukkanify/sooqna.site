"use client";

import type { UserProfile } from "@/types";
import { getSessionUser, setSessionUser } from "@/services/storage";

/** Reload the signed session from the server so RBAC matches stored permissions. */
export async function refreshAdminSession(): Promise<UserProfile | null> {
  try {
    const response = await fetch("/api/auth/session", { credentials: "include" });
    if (!response.ok) return getSessionUser();
    const data = (await response.json()) as { user?: UserProfile | null };
    if (data.user) {
      setSessionUser(data.user);
      return data.user;
    }
  } catch {
    /* keep the local snapshot */
  }
  return getSessionUser();
}
