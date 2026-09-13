import type { StoredUser } from "@/types/domain/user";
import { loadCollection, saveCollection } from "@/services/payments/data-store";

const MIRROR_FILE = "auth-users-mirror.json";

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
  const next = [
    user,
    ...users.filter(
      (item) =>
        item.id !== user.id &&
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
