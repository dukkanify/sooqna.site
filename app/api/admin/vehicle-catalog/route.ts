import { NextResponse } from "next/server";
import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import {
  getVehicleCatalogOverrides,
  saveVehicleCatalogOverrides,
} from "@/services/admin/vehicle-catalog-overrides-store";
import {
  getVehicleCatalog,
  getVehicleMakes,
  getVehicleModelsForMake,
  setVehicleCatalogOverrides,
  vehicleCatalogStats,
} from "@/shared/vehicles";

export const runtime = "nodejs";

async function applyOverrides() {
  const overrides = await getVehicleCatalogOverrides();
  setVehicleCatalogOverrides({
    disabledMakeSlugs: overrides.disabledMakeSlugs,
    disabledModelIds: overrides.disabledModelIds,
  });
  return overrides;
}

export async function GET() {
  const admin = await requireAdminPermission("categories", "view");
  if (!isSessionUser(admin)) return admin;

  const overrides = await applyOverrides();
  return NextResponse.json({
    stats: vehicleCatalogStats(),
    overrides,
    makes: getVehicleMakes({ includeDisabled: true }).map((item) => ({
      id: item.id,
      slug: item.slug,
      nameEn: item.nameEn,
      nameAr: item.nameAr,
      status: item.status,
      disabled: overrides.disabledMakeSlugs.includes(item.slug),
      modelCount: getVehicleModelsForMake(item.nameEn, {
        includeInactive: true,
      }).length,
    })),
    version: getVehicleCatalog().version,
  });
}

export async function PATCH(request: Request) {
  const admin = await requireAdminPermission("categories", "edit");
  if (!isSessionUser(admin)) return admin;

  const body = (await request.json().catch(() => null)) as {
    disabledMakeSlugs?: string[];
    disabledModelIds?: string[];
    toggleMakeSlug?: string;
    enabled?: boolean;
  } | null;

  const current = await getVehicleCatalogOverrides();
  let disabledMakeSlugs = [...current.disabledMakeSlugs];
  let disabledModelIds = [...current.disabledModelIds];

  if (Array.isArray(body?.disabledMakeSlugs)) {
    disabledMakeSlugs = body.disabledMakeSlugs;
  }
  if (Array.isArray(body?.disabledModelIds)) {
    disabledModelIds = body.disabledModelIds;
  }
  if (body?.toggleMakeSlug) {
    const slug = body.toggleMakeSlug.trim();
    const enabled = body.enabled !== false;
    disabledMakeSlugs = enabled
      ? disabledMakeSlugs.filter((item) => item !== slug)
      : [...new Set([...disabledMakeSlugs, slug])];
  }

  const saved = await saveVehicleCatalogOverrides({
    disabledMakeSlugs,
    disabledModelIds,
  });
  setVehicleCatalogOverrides({
    disabledMakeSlugs: saved.disabledMakeSlugs,
    disabledModelIds: saved.disabledModelIds,
  });

  return NextResponse.json({
    ok: true,
    overrides: saved,
    stats: vehicleCatalogStats(),
  });
}
