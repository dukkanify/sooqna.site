import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

type ConnectPlatformCapability = {
  id: string;
  signupEnabled: boolean;
  updatedAt: string;
};

const PLATFORM_ID = "platform";

const store = createPayloadCollectionStore<ConnectPlatformCapability>({
  table: "marketplace_stripe_connect_platform",
  fileName: "stripe-connect-platform.json",
});

export async function getStoredConnectSignupEnabled(): Promise<boolean | null> {
  const rows = await store.listAll();
  const row = rows.find((item) => item.id === PLATFORM_ID);
  if (!row) return null;
  return row.signupEnabled;
}

export async function setStoredConnectSignupEnabled(
  signupEnabled: boolean,
): Promise<void> {
  await store.upsert({
    id: PLATFORM_ID,
    signupEnabled,
    updatedAt: new Date().toISOString(),
  });
}
