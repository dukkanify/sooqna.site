import type { PushSubscriptionRecord } from "@/types/domain/notification";
import {
  getOptionalPostgresPool,
  isPostgresQuotaOrUnavailableError,
} from "@/services/db/postgres";
import { loadCollection, saveCollection } from "@/services/payments/data-store";

const FILE = "push-subscriptions.json";
const TABLE = "push_subscriptions";

let tableReady = false;

async function ensureTable(): Promise<boolean> {
  try {
    const pool = await getOptionalPostgresPool();
    if (!pool) return false;
    if (tableReady) return true;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        endpoint TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        auth TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON ${TABLE} (user_id)`,
    );
    tableReady = true;
    return true;
  } catch (error) {
    if (!isPostgresQuotaOrUnavailableError(error)) {
      console.error("[Sooqna Notify] push_subscriptions ensure failed", error);
    }
    return false;
  }
}

function rowToSubscription(row: Record<string, unknown>): PushSubscriptionRecord {
  return {
    userId: String(row.user_id),
    endpoint: String(row.endpoint),
    keys: {
      auth: String(row.auth),
      p256dh: String(row.p256dh),
    },
    userAgent: typeof row.user_agent === "string" ? row.user_agent : undefined,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

export async function listPushSubscriptions(
  userId: string,
): Promise<PushSubscriptionRecord[]> {
  if (await ensureTable()) {
    try {
      const pool = await getOptionalPostgresPool();
      if (!pool) return [];
      const result = await pool.query(
        `SELECT * FROM ${TABLE} WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId],
      );
      return result.rows.map(rowToSubscription);
    } catch (error) {
      if (!isPostgresQuotaOrUnavailableError(error)) {
        console.error("[Sooqna Notify] list push subscriptions failed", error);
      }
    }
  }

  const subscriptions = await loadCollection<PushSubscriptionRecord>(FILE);
  return subscriptions.filter((item) => item.userId === userId);
}

export async function savePushSubscription(
  input: Omit<PushSubscriptionRecord, "createdAt">,
): Promise<PushSubscriptionRecord> {
  const createdAt = new Date().toISOString();

  if (await ensureTable()) {
    try {
      const pool = await getOptionalPostgresPool();
      if (pool) {
        await pool.query(
          `INSERT INTO ${TABLE} (endpoint, user_id, auth, p256dh, user_agent, created_at)
           VALUES ($1, $2, $3, $4, $5, $6::timestamptz)
           ON CONFLICT (endpoint) DO UPDATE SET
             user_id = EXCLUDED.user_id,
             auth = EXCLUDED.auth,
             p256dh = EXCLUDED.p256dh,
             user_agent = EXCLUDED.user_agent`,
          [
            input.endpoint,
            input.userId,
            input.keys.auth,
            input.keys.p256dh,
            input.userAgent ?? null,
            createdAt,
          ],
        );
        return {
          ...input,
          createdAt,
        };
      }
    } catch (error) {
      if (!isPostgresQuotaOrUnavailableError(error)) {
        console.error("[Sooqna Notify] save push subscription failed", error);
      }
      // Fall through to JSON so subscribe does not 500 during Neon quota outages.
    }
  }

  const subscriptions = await loadCollection<PushSubscriptionRecord>(FILE);
  const existing = subscriptions.find((item) => item.endpoint === input.endpoint);
  if (existing) {
    existing.userId = input.userId;
    existing.keys = input.keys;
    existing.userAgent = input.userAgent;
    await saveCollection(FILE, subscriptions);
    return existing;
  }

  const record: PushSubscriptionRecord = {
    ...input,
    createdAt,
  };
  subscriptions.push(record);
  await saveCollection(FILE, subscriptions);
  return record;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  if (await ensureTable()) {
    try {
      const pool = await getOptionalPostgresPool();
      if (pool) {
        await pool.query(`DELETE FROM ${TABLE} WHERE endpoint = $1`, [endpoint]);
        return;
      }
    } catch (error) {
      if (!isPostgresQuotaOrUnavailableError(error)) {
        console.error("[Sooqna Notify] delete push subscription failed", error);
      }
    }
  }

  const subscriptions = await loadCollection<PushSubscriptionRecord>(FILE);
  const next = subscriptions.filter((item) => item.endpoint !== endpoint);
  if (next.length !== subscriptions.length) {
    await saveCollection(FILE, next);
  }
}
