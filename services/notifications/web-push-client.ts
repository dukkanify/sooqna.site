import webpush from "web-push";
import { findUserById } from "@/services/auth/user-store";
import { BRAND } from "@/shared/constants/brand";
import { tx } from "@/shared/i18n/tx";
import { getOptionalPostgresPool } from "@/services/db/postgres";
import { loadRecord, saveRecord } from "@/services/payments/data-store";
import {
  deletePushSubscription,
  listPushSubscriptions,
} from "@/services/notifications/push-subscriptions";
import type { AppNotification } from "@/types/domain/notification";

type VapidKeys = {
  privateKey: string;
  publicKey: string;
};

const VAPID_FILE = "vapid-keys.json";
const VAPID_TABLE = "app_vapid_keys";

let vapidTableReady = false;
let cachedKeys: VapidKeys | null = null;

function envVapidKeys(): VapidKeys | null {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey };
}

async function ensureVapidTable(): Promise<boolean> {
  const pool = await getOptionalPostgresPool();
  if (!pool) return false;
  if (vapidTableReady) return true;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${VAPID_TABLE} (
      id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      public_key TEXT NOT NULL,
      private_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  vapidTableReady = true;
  return true;
}

async function loadVapidFromPostgres(): Promise<VapidKeys | null> {
  if (!(await ensureVapidTable())) return null;
  const pool = await getOptionalPostgresPool();
  if (!pool) return null;
  const result = await pool.query(
    `SELECT public_key, private_key FROM ${VAPID_TABLE} WHERE id = 1 LIMIT 1`,
  );
  const row = result.rows[0];
  if (!row?.public_key || !row?.private_key) return null;
  return {
    publicKey: String(row.public_key),
    privateKey: String(row.private_key),
  };
}

async function saveVapidToPostgres(keys: VapidKeys): Promise<VapidKeys> {
  if (!(await ensureVapidTable())) return keys;
  const pool = await getOptionalPostgresPool();
  if (!pool) return keys;
  try {
    await pool.query(
      `INSERT INTO ${VAPID_TABLE} (id, public_key, private_key)
       VALUES (1, $1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [keys.publicKey, keys.privateKey],
    );
  } catch (error) {
    console.error("[Sooqna Notify] failed to persist VAPID keys", error);
  }
  // Another instance may have won the insert race — always re-read.
  return (await loadVapidFromPostgres()) ?? keys;
}

async function getVapidKeys(): Promise<VapidKeys | null> {
  if (cachedKeys) return cachedKeys;

  const fromEnv = envVapidKeys();
  if (fromEnv) {
    cachedKeys = fromEnv;
    return fromEnv;
  }

  const fromPostgres = await loadVapidFromPostgres();
  if (fromPostgres) {
    cachedKeys = fromPostgres;
    return fromPostgres;
  }

  const stored = await loadRecord<VapidKeys>(VAPID_FILE);
  if (stored?.publicKey && stored?.privateKey) {
    // Promote local/ephemeral keys into Postgres when available.
    const promoted = await saveVapidToPostgres(stored);
    cachedKeys = promoted;
    return promoted;
  }

  const generated = webpush.generateVAPIDKeys();
  const keys: VapidKeys = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
  };

  await saveVapidToPostgres(keys);
  const durable = await loadVapidFromPostgres();
  if (durable) {
    cachedKeys = durable;
    return durable;
  }

  // Serverless hosts cannot share file-backed keys across instances.
  if (process.env.VERCEL) {
    console.error(
      "[Sooqna Notify] VAPID keys need Postgres or VAPID_* env vars on Vercel",
    );
    return null;
  }

  await saveRecord(VAPID_FILE, keys);
  cachedKeys = keys;
  return keys;
}

export async function getVapidPublicKey(): Promise<string | null> {
  const keys = await getVapidKeys();
  return keys?.publicKey ?? null;
}

function configureWebPush(keys: VapidKeys) {
  webpush.setVapidDetails(
    `mailto:${BRAND.supportEmail}`,
    keys.publicKey,
    keys.privateKey,
  );
}

export async function dispatchWebPush(notification: AppNotification): Promise<void> {
  const keys = await getVapidKeys();
  if (!keys) return;

  const subscriptions = await listPushSubscriptions(notification.userId);
  if (subscriptions.length === 0) return;

  configureWebPush(keys);
  const user = await findUserById(notification.userId);
  const english = user?.preferredLocale === "en";
  const payload = JSON.stringify({
    id: notification.id,
    title: english
      ? notification.titleEn || tx("en", notification.title)
      : notification.title,
    body: english
      ? notification.bodyEn || tx("en", notification.body)
      : notification.body,
    href: notification.href || "/notifications",
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          },
          payload,
          { TTL: 60 * 60 * 12, urgency: "normal" },
        );
      } catch (error) {
        const status =
          error && typeof error === "object" && "statusCode" in error
            ? Number(error.statusCode)
            : 0;
        if (status === 404 || status === 410) {
          await deletePushSubscription(subscription.endpoint);
          return;
        }
        console.error("[Sooqna Notify] web push failed", error);
      }
    }),
  );
}
