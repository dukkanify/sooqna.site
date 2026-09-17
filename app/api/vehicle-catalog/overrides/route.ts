import { NextResponse } from "next/server";
import { loadAndApplyVehicleCatalogOverrides } from "@/services/admin/apply-vehicle-catalog-overrides";

export const runtime = "nodejs";

/** Public read of disabled/added make/model overrides for listing/search option lists. */
export async function GET() {
  const overrides = await loadAndApplyVehicleCatalogOverrides();
  return NextResponse.json({
    disabledMakeSlugs: overrides.disabledMakeSlugs,
    disabledModelIds: overrides.disabledModelIds,
    addedModels: overrides.addedModels,
    updatedAt: overrides.updatedAt,
  });
}
