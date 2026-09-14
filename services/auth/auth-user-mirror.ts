import type { StoredUser } from "@/types/domain/user";
import { loadCollection, saveCollection } from "@/services/payments/data-store";

const MIRROR_FILE = "auth-users-mirror.json";

function passwordUpdatedMs(user: StoredUser | null | undefined): number {
  const raw = user?.passwordUpdatedAt;
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

/** Prefer the copy whose password was changed more recently (emergency vs Postgres). */
export function preferNewerPasswordUser(
  primary: StoredUser,
  secondary: StoredUser | null | undefined,
): StoredUser {
  if (!secondary?.passwordHash) return primary;
  if (!primary.passwordHash) return { ...primary, passwordHash: secondary.passwordHash, passwordUpdatedAt: secondary.passwordUpdatedAt };
  if (primary.passwordHash === secondary.passwordHash) {
    return passwordUpdatedMs(secondary) > passwordUpdatedMs(primary)
      ? { ...primary, passwordUpdatedAt: secondary.passwordUpdatedAt }
      : primary;
  }
  if (passwordUpdatedMs(secondary) > passwordUpdatedMs(primary)) {
    return {
      ...primary,
      passwordHash: secondary.passwordHash,
      passwordUpdatedAt: secondary.passwordUpdatedAt,
      sessionVersion: secondary.sessionVersion ?? primary.sessionVersion,
    };
  }
  return primary;
}

/** Best-effort per-instance mirror so auth can survive short Neon outages. */
export async function readAuthUserMirror(): Promise<StoredUser[]> {
  try {
    return await loadCollection<StoredUser>(MIRROR_FILE);
  } catch {
    return [];
  }
}

export async function writeAuthUserMirror(users: StoredUser[]): Promise<void> {
  try {
    await saveCollection(MIRROR_FILE, users.slice(0, 5000));
  } catch (error) {
    console.error("[Sooqna Auth] mirror write failed", error);
  }
}

export async function upsertAuthUserMirror(user: StoredUser): Promise<void> {
  const users = await readAuthUserMirror();
  const email = user.email.trim().toLowerCase();
  const existing =
    users.find(
      (item) =>
        item.id === user.id ||
        item.email.trim().toLowerCase() === email ||
        (item.normalizedEmail ?? "").toLowerCase() === email,
    ) ?? null;
  // Never clobber a newer emergency password with an older Postgres row.
  const merged = preferNewerPasswordUser(user, existing);
  const next = [
    merged,
    ...users.filter(
      (item) =>
        item.id !== merged.id &&
        item.email.trim().toLowerCase() !== email &&
        (item.normalizedEmail ?? "").toLowerCase() !== email,
    ),
  ];
  await writeAuthUserMirror(next);
}

export async function findAuthUserInMirrorByEmail(
  email: string,
): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  const users = await readAuthUserMirror();
  return (
    users.find(
      (user) =>
        user.email.trim().toLowerCase() === normalized ||
        (user.normalizedEmail ?? "").toLowerCase() === normalized,
    ) ?? null
  );
}

export async function findAuthUserInMirrorById(
  id: string,
): Promise<StoredUser | null> {
  const users = await readAuthUserMirror();
  return users.find((user) => user.id === id) ?? null;
}
