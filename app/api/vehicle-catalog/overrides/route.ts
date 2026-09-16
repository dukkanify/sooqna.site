import { NextResponse } from "next/server";
import { getVehicleCatalogOverrides } from "@/services/admin/vehicle-catalog-overrides-store";
import { setVehicleCatalogOverrides } from "@/shared/vehicles";

export const runtime = "nodejs";

/** Public read of disabled make/model overrides for listing/search option lists. */
export async function GET() {
  const overrides = await getVehicleCatalogOverrides();
  setVehicleCatalogOverrides({
    disabledMakeSlugs: overrides.disabledMakeSlugs,
    disabledModelIds: overrides.disabledModelIds,
  });
  return NextResponse.json({
    disabledMakeSlugs: overrides.disabledMakeSlugs,
    disabledModelIds: overrides.disabledModelIds,
    updatedAt: overrides.updatedAt,
  });
}
