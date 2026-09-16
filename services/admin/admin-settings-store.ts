import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

export type AdminSiteSettings = {
  platformFeePercent: number;
  gatewayFeePercent: number;
  gatewayFeeFixed: number;
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  autoApproveUsers: boolean;
  escrowHoldDays: number;
  disputeWindowDays: number;
  listingActiveDays: number;
  featuredListingFeeAed: number;
  featuredListingDays: number;
  supportEmail: string;
  stripeDashboardUrl: string;
  updatedAt: string;
};

type SettingsRecord = AdminSiteSettings & { id: string };

const SETTINGS_ID = "site";

const store = createPayloadCollectionStore<SettingsRecord>({
  table: "marketplace_admin_settings",
  fileName: "sooqna-admin-settings.json",
});

const DEFAULT_SETTINGS: AdminSiteSettings = {
  platformFeePercent: 2.5,
  gatewayFeePercent: 2.9,
  gatewayFeeFixed: 1,
  maintenanceMode: false,
  allowGuestCheckout: true,
  autoApproveUsers: true,
  escrowHoldDays: 7,
  disputeWindowDays: 7,
  listingActiveDays: 30,
  featuredListingFeeAed: 49,
  featuredListingDays: 14,
  supportEmail: "support@sooqnauae.com",
  stripeDashboardUrl: "https://dashboard.stripe.com",
  updatedAt: new Date().toISOString(),
};

let cached: AdminSiteSettings | null = null;

function stripId(record: SettingsRecord): AdminSiteSettings {
  const { id, ...settings } = record;
  void id;
  return settings;
}

export async function getAdminSettings(): Promise<AdminSiteSettings> {
  if (cached) return cached;
  const rows = await store.listAll();
  const row = rows.find((item) => item.id === SETTINGS_ID) ?? rows[0];
  cached = row ? { ...DEFAULT_SETTINGS, ...stripId(row) } : { ...DEFAULT_SETTINGS };
  return cached;
}

/** Sync snapshot for fee calculator — falls back to defaults until hydrated. */
export function getAdminSettingsSync(): AdminSiteSettings {
  return cached ?? { ...DEFAULT_SETTINGS };
}

export async function updateAdminSettings(
  patch: Partial<Omit<AdminSiteSettings, "updatedAt">>,
): Promise<AdminSiteSettings> {
  const current = await getAdminSettings();
  const next: AdminSiteSettings = {
    ...current,
    ...patch,
    platformFeePercent: clampPercent(
      patch.platformFeePercent ?? current.platformFeePercent,
    ),
    gatewayFeePercent: clampPercent(
      patch.gatewayFeePercent ?? current.gatewayFeePercent,
    ),
    gatewayFeeFixed: Math.max(0, patch.gatewayFeeFixed ?? current.gatewayFeeFixed),
    escrowHoldDays: Math.max(
      1,
      Math.round(patch.escrowHoldDays ?? current.escrowHoldDays),
    ),
    disputeWindowDays: Math.max(
      1,
      Math.round(patch.disputeWindowDays ?? current.disputeWindowDays),
    ),
    listingActiveDays: Math.max(
      1,
      Math.round(patch.listingActiveDays ?? current.listingActiveDays),
    ),
    featuredListingFeeAed: Math.max(
      0,
      Math.round(
        (patch.featuredListingFeeAed ?? current.featuredListingFeeAed) * 100,
      ) / 100,
    ),
    featuredListingDays: Math.max(
      1,
      Math.round(patch.featuredListingDays ?? current.featuredListingDays),
    ),
    autoApproveUsers:
      typeof patch.autoApproveUsers === "boolean"
        ? patch.autoApproveUsers
        : current.autoApproveUsers,
    updatedAt: new Date().toISOString(),
  };
  cached = next;
  await store.upsert({ ...next, id: SETTINGS_ID });
  return next;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(30, Math.max(0, Math.round(value * 100) / 100));
}
