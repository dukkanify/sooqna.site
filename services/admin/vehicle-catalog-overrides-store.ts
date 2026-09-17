import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

export type AddedVehicleModel = {
  id: string;
  makeSlug: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  sourceSuggestionId?: string;
};

export type VehicleCatalogOverrides = {
  id: string;
  disabledMakeSlugs: string[];
  disabledModelIds: string[];
  addedModels: AddedVehicleModel[];
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
  addedModels: [],
  updatedAt: new Date(0).toISOString(),
};

function normalizeAddedModels(
  rows: AddedVehicleModel[] | undefined,
): AddedVehicleModel[] {
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  const next: AddedVehicleModel[] = [];
  for (const row of rows) {
    const makeSlug = String(row.makeSlug ?? "")
      .trim()
      .toLowerCase();
    const slug = String(row.slug ?? "")
      .trim()
      .toLowerCase();
    const nameEn = String(row.nameEn ?? "").trim();
    if (!makeSlug || !slug || !nameEn) continue;
    const key = `${makeSlug}::${slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({
      id: String(row.id ?? `model-added-${makeSlug}-${slug}`).trim(),
      makeSlug,
      slug,
      nameEn,
      nameAr: String(row.nameAr ?? nameEn).trim() || nameEn,
      active: row.active !== false,
      sortOrder: Number.isFinite(row.sortOrder) ? Number(row.sortOrder) : 9000,
      createdAt: row.createdAt || new Date().toISOString(),
      sourceSuggestionId: row.sourceSuggestionId,
    });
  }
  return next;
}

export async function getVehicleCatalogOverrides(): Promise<VehicleCatalogOverrides> {
  const rows = await store.listAll();
  const row = rows.find((item) => item.id === STORE_ID);
  if (!row) return { ...EMPTY };
  return {
    id: STORE_ID,
    disabledMakeSlugs: Array.isArray(row.disabledMakeSlugs)
      ? row.disabledMakeSlugs
      : [],
    disabledModelIds: Array.isArray(row.disabledModelIds)
      ? row.disabledModelIds
      : [],
    addedModels: normalizeAddedModels(row.addedModels),
    updatedAt: row.updatedAt || EMPTY.updatedAt,
  };
}

export async function saveVehicleCatalogOverrides(input: {
  disabledMakeSlugs: string[];
  disabledModelIds: string[];
  addedModels?: AddedVehicleModel[];
}): Promise<VehicleCatalogOverrides> {
  const next: VehicleCatalogOverrides = {
    id: STORE_ID,
    disabledMakeSlugs: [
      ...new Set(input.disabledMakeSlugs.map((s) => s.trim()).filter(Boolean)),
    ],
    disabledModelIds: [
      ...new Set(input.disabledModelIds.map((s) => s.trim()).filter(Boolean)),
    ],
    addedModels: normalizeAddedModels(input.addedModels),
    updatedAt: new Date().toISOString(),
  };
  await store.upsert(next);
  return next;
}

export function slugifyVehicleModelName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

/** Parse create-listing suggestion value: "Toyota: Raize Cross" → parts. */
export function parseMakeModelSuggestion(value: string): {
  makeName: string;
  modelName: string;
} | null {
  const trimmed = value.trim();
  const idx = trimmed.indexOf(":");
  if (idx <= 0) return null;
  const makeName = trimmed.slice(0, idx).trim();
  const modelName = trimmed.slice(idx + 1).trim();
  if (!makeName || !modelName) return null;
  return { makeName, modelName };
}
