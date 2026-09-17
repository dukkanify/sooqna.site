import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";

export type OptionSuggestionStatus = "pending" | "approved" | "rejected";

export type OptionSuggestion = {
  id: string;
  categoryId: string;
  fieldKey: string;
  value: string;
  requestedByUserId: string;
  requestedByName?: string;
  status: OptionSuggestionStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedByAdminId?: string;
  listingId?: string;
};

const store = createPayloadCollectionStore<OptionSuggestion>({
  table: "option_suggestions",
  fileName: "sooqna-option-suggestions.json",
});

export async function createOptionSuggestion(input: {
  categoryId: string;
  fieldKey: string;
  value: string;
  requestedByUserId: string;
  requestedByName?: string;
  listingId?: string;
}): Promise<OptionSuggestion> {
  const value = input.value.trim();
  const record: OptionSuggestion = {
    id: `optsug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    categoryId: input.categoryId,
    fieldKey: input.fieldKey,
    value,
    requestedByUserId: input.requestedByUserId,
    requestedByName: input.requestedByName,
    status: "pending",
    createdAt: new Date().toISOString(),
    listingId: input.listingId,
  };
  await store.upsert(record);
  return record;
}

export async function listOptionSuggestions(status?: OptionSuggestionStatus) {
  const rows = await store.listAll();
  const filtered = status ? rows.filter((row) => row.status === status) : rows;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function reviewOptionSuggestion(input: {
  id: string;
  status: Exclude<OptionSuggestionStatus, "pending">;
  adminId: string;
}): Promise<OptionSuggestion | null> {
  const rows = await store.listAll();
  const current = rows.find((row) => row.id === input.id);
  if (!current) return null;
  const next: OptionSuggestion = {
    ...current,
    status: input.status,
    reviewedAt: new Date().toISOString(),
    reviewedByAdminId: input.adminId,
  };
  await store.upsert(next);

  if (input.status === "approved") {
    if (current.categoryId === "cars" && current.fieldKey === "model") {
      const {
        parseMakeModelSuggestion,
        getVehicleCatalogOverrides,
        saveVehicleCatalogOverrides,
        slugifyVehicleModelName,
      } = await import("@/services/admin/vehicle-catalog-overrides-store");
      const {
        getVehicleMakeByName,
        getVehicleModelsForMake,
        resolveVehicleMakeName,
      } = await import("@/shared/vehicles");
      const { applyVehicleCatalogOverridesRuntime } = await import(
        "@/services/admin/apply-vehicle-catalog-overrides"
      );

      const parsed = parseMakeModelSuggestion(current.value);
      if (parsed) {
        const make = getVehicleMakeByName(
          resolveVehicleMakeName(parsed.makeName) ?? parsed.makeName,
        );
        if (make) {
          const overrides = await getVehicleCatalogOverrides();
          applyVehicleCatalogOverridesRuntime(overrides);
          const slug = slugifyVehicleModelName(parsed.modelName);
          const exists = getVehicleModelsForMake(make.nameEn, {
            includeInactive: true,
          }).some(
            (model) =>
              model.slug === slug ||
              model.nameEn.toLowerCase() === parsed.modelName.toLowerCase(),
          );
          const alreadyAdded = overrides.addedModels.some(
            (row) => row.makeSlug === make.slug && row.slug === slug,
          );
          if (slug && !exists && !alreadyAdded) {
            const saved = await saveVehicleCatalogOverrides({
              disabledMakeSlugs: overrides.disabledMakeSlugs,
              disabledModelIds: overrides.disabledModelIds,
              addedModels: [
                ...overrides.addedModels,
                {
                  id: `model-added-${make.slug}-${slug}`,
                  makeSlug: make.slug,
                  slug,
                  nameEn: parsed.modelName,
                  nameAr: parsed.modelName,
                  active: true,
                  sortOrder: 9000 + overrides.addedModels.length,
                  createdAt: new Date().toISOString(),
                  sourceSuggestionId: current.id,
                },
              ],
            });
            applyVehicleCatalogOverridesRuntime(saved);
          }
        }
      }
    } else {
      const { upsertApprovedFieldOption } = await import(
        "@/services/admin/approved-field-options-store"
      );
      await upsertApprovedFieldOption({
        categoryId: current.categoryId,
        fieldKey: current.fieldKey,
        label: current.value,
        value: current.value,
        approvedByAdminId: input.adminId,
      });
    }
  }

  return next;
}
