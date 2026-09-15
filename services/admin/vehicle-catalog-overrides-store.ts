import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

export type VehicleCatalogOverrides = {
  id: string;
  disabledMakeSlugs: string[];
  disabledModelIds: string[];
  updatedAt: string;
};

const STORE_ID = "vehicle-catalog";

const store = createPayloadCollectionStore<VehicleCatalogOverrides>({
  table: "marketplace_vehicle_catalog_overrides",
  fileName: "sooqna-vehicle-catalog-overrides.json",
});

const EMPTY: VehicleCatalogOverrides = {
  id: STORE_ID,
  disabledMakeSlugs: [],
  disabledModelIds: [],
  updatedAt: new Date(0).toISOString(),
};

export async function getVehicleCatalogOverrides(): Promise<VehicleCatalogOverrides> {
  const rows = await store.listAll();
  return rows.find((row) => row.id === STORE_ID) ?? { ...EMPTY };
}

export async function saveVehicleCatalogOverrides(input: {
  disabledMakeSlugs: string[];
  disabledModelIds: string[];
}): Promise<VehicleCatalogOverrides> {
  const next: VehicleCatalogOverrides = {
    id: STORE_ID,
    disabledMakeSlugs: [
      ...new Set(input.disabledMakeSlugs.map((s) => s.trim()).filter(Boolean)),
    ],
    disabledModelIds: [
      ...new Set(input.disabledModelIds.map((s) => s.trim()).filter(Boolean)),
    ],
    updatedAt: new Date().toISOString(),
  };
  await store.upsert(next);
  return next;
}
