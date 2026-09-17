import {
  getVehicleCatalogOverrides,
  type VehicleCatalogOverrides,
} from "@/services/admin/vehicle-catalog-overrides-store";
import { setVehicleCatalogOverrides } from "@/shared/vehicles";

export function applyVehicleCatalogOverridesRuntime(
  overrides: VehicleCatalogOverrides,
): void {
  setVehicleCatalogOverrides({
    disabledMakeSlugs: overrides.disabledMakeSlugs,
    disabledModelIds: overrides.disabledModelIds,
    addedModels: overrides.addedModels,
  });
}

export async function loadAndApplyVehicleCatalogOverrides(): Promise<VehicleCatalogOverrides> {
  const overrides = await getVehicleCatalogOverrides();
  applyVehicleCatalogOverridesRuntime(overrides);
  return overrides;
}
