import { getOptionalPostgresPool } from "@/services/db/postgres";
import { rememberDeletedListingId } from "@/services/listings/listing-persistence";
import { clearListingMemoryCache } from "@/services/listings/listing-store";

/** Exact Production IDs approved 2026-09-15. Do not expand this set. */
export const QA_USERS_TO_DELETE = [
  "user-1787138969431-f6aeeef2",
  "user-1787139018754-93668a7d",
  "user-1787139754670-a44e75db",
  "user-1787141211938-d99e025f",
  "user-1787141249149-6d39fdfb",
  "user-1787141668124-39cd5a1a",
  "user-1787145100179-5de8db6c",
  "user-1787195378464-76bbb990",
  "user-1787195807829-288b0f17",
  "user-1787196180416-ece09c11",
  "user-1787831951466-1302798f",
  "user-1788024845851-44cf682e",
  "user-1788648128805-8bc4aa61",
  "user-1788797445833-f20853d6",
  "user-1788797979530-1d64130e",
  "user-1788798135015-ed47a328",
  "user-1788799149091-30dac254",
  "user-1788799277710-c9aa73f4",
  "user-1788799350730-251e1436",
  "user-1788799373454-f7707a18",
  "user-1788799373704-9d0d4d12",
  "user-1788799374126-fdea0a54",
  "user-1788799395141-906acfcc",
  "user-1788799415563-bf8aa12d",
  "user-1788799465640-3af0af94",
  "user-1788799513080-564bc333",
  "user-1788799608717-338be614",
  "user-1788800210605-ac88cd67",
  "user-1788809819142-d037e457",
  "user-1788810147098-e788cebf",
  "user-1788810245756-8bb723b7",
  "user-1788811309268-886c26e0",
  "user-1788811692663-0eacfce3",
  "user-1788812506944-91e35b67",
  "user-1788814241219-f58e1c22",
  "user-1788815104714-48bd68b3",
  "user-1788882579141-d849b8ba",
  "user-1788995894505-2110fbf4",
  "user-1789059360198-f42d90a4",
  "user-1789060077902-2262d2eb",
  "user-1789119168261-f1711d77",
  "user-1789178821322-8bb77eb3",
  "user-1789379457956-d26c9db2",
  "user-1789379503923-87a5d659",
  "user-1789382154034-faab78f5",
  "user-1789383672009-fa5a1398",
  "user-1789385051222-93748f31",
  "user-1789385142208-134e8e67",
  "user-1789389421826-176feb5a",
  "user-1789395184797-9a25c1e6",
  "user-1789395319314-52ad5c13",
] as const;

export const QA_LISTINGS_TO_DELETE = [
  "e2e-3e7fe7b7",
  "e2e-75f978af",
  "e2e-a53b6e42",
  "e2e-a5ae9a72",
  "e2e-bbd9ce84",
] as const;

export const QA_NOTIFICATIONS_TO_DELETE = [
  "ntf-1788799518825-q7lnf8",
  "ntf-1788799614360-hlq80h",
  "ntf-1788800215126-554dfa",
  "ntf-1788810154364-uhad1u",
  "ntf-1788810254965-agemdu",
  "ntf-1788810258510-byzw5n",
  "ntf-1788810386314-ap5te6",
  "ntf-1788811317141-pnm3wf",
  "ntf-1788811319792-dxpz7a",
  "ntf-1788811435609-hbq9js",
  "ntf-1788811699834-sa8v8j",
  "ntf-1788811702128-wyy0wv",
  "ntf-1788811708386-tv9lbj",
  "ntf-1788814249422-ar9jf4",
  "ntf-1788814252420-umve8u",
  "ntf-1788814257701-1byeg7",
  "ntf-1788815114323-pt95mc",
  "ntf-1788815116875-gmv8l5",
  "ntf-1788815122166-oxd8zr",
  "ntf-1788882586119-cc4fam",
  "ntf-1788995937835-w6o678",
  "ntf-1789060078089-kpdbbu",
  "ntf-1789119168425-xvs0e8",
  "ntf-1789379462955-nkdso5",
  "ntf-1789379508937-dkl33y",
  "ntf-1789382158433-wux1eo",
  "ntf-1789383675805-1c8od5",
  "ntf-1789385056286-54mntb",
  "ntf-1789385146103-eppdhv",
  "ntf-1789389425599-52j1gw",
  "ntf-1789395189787-ertqak",
  "ntf-1789395324487-0hb5lh",
] as const;

export const QA_ISOLATED_CLEANUP_CONFIRM = "DELETE_APPROVED_QA_ISOLATED";

export const BLOCKED_LISTING_IDS = [
  "e2e-14871a0c",
  "e2e-001ab765",
  "e2e-160c882d",
  "e2e-91d0c522",
  "qa26-fu-be50a099",
  "qa26-mb-be50a099",
  "qa26-js-be50a099",
  "qa26-jv-be50a099",
  "qa26-re-be50a099",
  "qa26-el-be50a099",
  "qa26-car-be50a099",
  "local-1789075968004",
  "local-1788919686292",
] as const;

export const BLOCKED_USER_IDS = [
  "user-1788882208431-b43d0b96",
  "user-1788877192498-ff9ec889",
  "user-1788816404098-7fda5988",
  "demo-user-001",
  "demo-admin-001",
  "demo-business-001",
] as const;

export type QaIsolatedCleanupResult = {
  ok: boolean;
  error?: string;
  unsafeCount: number;
  usersDeleted: number;
  listingsDeleted: number;
  notificationsDeleted: number;
  usersFound: number;
  listingsFound: number;
  notificationsFound: number;
  deletedUserIds: string[];
  deletedListingIds: string[];
  deletedNotificationIds: string[];
};

const DELETE_SQL = `
WITH params AS (
  SELECT
    $1::text[] AS notif_ids,
    $2::text[] AS listing_ids,
    $3::text[] AS user_ids
),
order_hits AS (
  SELECT o.id
  FROM marketplace_orders o, params p
  WHERE o.payload->>'listingId' = ANY(p.listing_ids)
     OR o.payload->>'buyerId' = ANY(p.user_ids)
),
stripe_hits AS (
  SELECT e.id
  FROM payment_event_logs e, params p
  WHERE e.payload->>'listingId' = ANY(p.listing_ids)
     OR e.payload->>'orderId' IN (
       SELECT o.id FROM marketplace_orders o, params p2
       WHERE o.payload->>'listingId' = ANY(p2.listing_ids)
          OR o.payload->>'buyerId' = ANY(p2.user_ids)
     )
),
booking_hits AS (
  SELECT b.id
  FROM viewing_bookings b, params p
  WHERE b.id = 'view-1787993086427'
    AND (
      b.payload->>'buyerId' = ANY(p.user_ids)
      OR b.payload->>'listingId' = ANY(p.listing_ids)
    )
),
blocked_listing_hits AS (
  SELECT l.id
  FROM marketplace_listings l, params p
  WHERE l.id = ANY(p.listing_ids)
    AND (
      l.id LIKE 'showcase-%'
      OR l.id LIKE 'live-mkt-%'
      OR l.id LIKE 'qa26-%'
      OR l.id IN (
        'e2e-14871a0c',
        'e2e-001ab765',
        'e2e-160c882d',
        'e2e-91d0c522',
        'local-1789075968004'
      )
    )
),
blocked_user_hits AS (
  SELECT u.id
  FROM auth_users u, params p
  WHERE u.id = ANY(p.user_ids)
    AND (
      u.id IN (
        'demo-user-001',
        'demo-admin-001',
        'demo-business-001',
        'user-1788882208431-b43d0b96',
        'user-1788877192498-ff9ec889',
        'user-1788816404098-7fda5988'
      )
      OR COALESCE(u.payload->>'email', '') ILIKE '%@sooqna.demo'
    )
),
unsafe AS (
  SELECT id FROM order_hits
  UNION ALL SELECT id FROM stripe_hits
  UNION ALL SELECT id FROM booking_hits
  UNION ALL SELECT id FROM blocked_listing_hits
  UNION ALL SELECT id FROM blocked_user_hits
),
del_n AS (
  DELETE FROM app_notifications n
  USING params p
  WHERE n.id = ANY(p.notif_ids)
    AND n.user_id = ANY(p.user_ids)
    AND NOT EXISTS (SELECT 1 FROM unsafe)
  RETURNING n.id
),
del_l AS (
  DELETE FROM marketplace_listings l
  USING params p
  WHERE l.id = ANY(p.listing_ids)
    AND l.seller_id = ANY(p.user_ids)
    AND l.id NOT LIKE 'showcase-%'
    AND l.id NOT LIKE 'live-mkt-%'
    AND l.id NOT LIKE 'qa26-%'
    AND NOT EXISTS (SELECT 1 FROM unsafe)
  RETURNING l.id
),
del_u AS (
  DELETE FROM auth_users u
  USING params p
  WHERE u.id = ANY(p.user_ids)
    AND u.id NOT IN (
      'demo-user-001',
      'demo-admin-001',
      'demo-business-001'
    )
    AND COALESCE(u.payload->>'email', '') NOT ILIKE '%@sooqna.demo'
    AND NOT EXISTS (SELECT 1 FROM unsafe)
  RETURNING u.id
)
SELECT
  (SELECT COUNT(*)::int FROM unsafe) AS unsafe_count,
  COALESCE((SELECT array_agg(id ORDER BY id) FROM del_n), ARRAY[]::text[]) AS notification_ids,
  COALESCE((SELECT array_agg(id ORDER BY id) FROM del_l), ARRAY[]::text[]) AS listing_ids,
  COALESCE((SELECT array_agg(id ORDER BY id) FROM del_u), ARRAY[]::text[]) AS user_ids
`;

const COUNT_SQL = `
SELECT
  (SELECT COUNT(*)::int FROM app_notifications WHERE id = ANY($1::text[])) AS notifications_found,
  (SELECT COUNT(*)::int FROM marketplace_listings WHERE id = ANY($2::text[])) AS listings_found,
  (SELECT COUNT(*)::int FROM auth_users WHERE id = ANY($3::text[])) AS users_found
`;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function countQaIsolatedTargets(): Promise<{
  usersFound: number;
  listingsFound: number;
  notificationsFound: number;
}> {
  const pool = await getOptionalPostgresPool();
  if (!pool) {
    throw new Error("QA_CLEANUP_REQUIRES_POSTGRES");
  }
  const result = await pool.query(COUNT_SQL, [
    [...QA_NOTIFICATIONS_TO_DELETE],
    [...QA_LISTINGS_TO_DELETE],
    [...QA_USERS_TO_DELETE],
  ]);
  const row = result.rows[0] ?? {};
  return {
    notificationsFound: Number(row.notifications_found ?? 0),
    listingsFound: Number(row.listings_found ?? 0),
    usersFound: Number(row.users_found ?? 0),
  };
}

export async function runQaIsolatedCleanup(): Promise<QaIsolatedCleanupResult> {
  const pool = await getOptionalPostgresPool();
  if (!pool) {
    throw new Error("QA_CLEANUP_REQUIRES_POSTGRES");
  }

  const before = await countQaIsolatedTargets();
  const result = await pool.query(DELETE_SQL, [
    [...QA_NOTIFICATIONS_TO_DELETE],
    [...QA_LISTINGS_TO_DELETE],
    [...QA_USERS_TO_DELETE],
  ]);
  const row = result.rows[0] ?? {};
  const unsafeCount = Number(row.unsafe_count ?? 0);
  const deletedNotificationIds = asStringArray(row.notification_ids);
  const deletedListingIds = asStringArray(row.listing_ids);
  const deletedUserIds = asStringArray(row.user_ids);

  if (unsafeCount > 0) {
    return {
      ok: false,
      error: "UNSAFE_REFERENCE",
      unsafeCount,
      usersDeleted: 0,
      listingsDeleted: 0,
      notificationsDeleted: 0,
      ...before,
      deletedUserIds: [],
      deletedListingIds: [],
      deletedNotificationIds: [],
    };
  }

  for (const id of deletedListingIds) {
    await rememberDeletedListingId(id);
  }
  clearListingMemoryCache();

  return {
    ok: true,
    unsafeCount: 0,
    usersDeleted: deletedUserIds.length,
    listingsDeleted: deletedListingIds.length,
    notificationsDeleted: deletedNotificationIds.length,
    ...before,
    deletedUserIds,
    deletedListingIds,
    deletedNotificationIds,
  };
}
