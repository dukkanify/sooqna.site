import { NextResponse } from "next/server";
import { isSessionUser } from "@/services/auth/require-session";
import { requireAdminPermission } from "@/services/auth/admin-permissions";
import {
  getVehicleCatalogOverrides,
  saveVehicleCatalogOverrides,
  slugifyVehicleModelName,
  type AddedVehicleModel,
} from "@/services/admin/vehicle-catalog-overrides-store";
import { applyVehicleCatalogOverridesRuntime } from "@/services/admin/apply-vehicle-catalog-overrides";
import {
  getVehicleCatalog,
  getVehicleMakeByName,
  getVehicleMakeBySlug,
  getVehicleMakes,
  getVehicleModelsForMake,
  resolveVehicleMakeName,
  vehicleCatalogStats,
} from "@/shared/vehicles";

export const runtime = "nodejs";

async function applyOverrides() {
  const overrides = await getVehicleCatalogOverrides();
  applyVehicleCatalogOverridesRuntime(overrides);
  return overrides;
}

export async function GET() {
  const admin = await requireAdminPermission("categories", "view");
  if (!isSessionUser(admin)) return admin;

  const overrides = await applyOverrides();
  const disabledModels = new Set(overrides.disabledModelIds);
  const addedIds = new Set(overrides.addedModels.map((row) => row.id));
  return NextResponse.json({
    stats: vehicleCatalogStats(),
    overrides,
    makes: getVehicleMakes({ includeDisabled: true }).map((item) => {
      const models = getVehicleModelsForMake(item.nameEn, {
        includeInactive: true,
      }).map((model) => ({
        id: model.id,
        slug: model.slug,
        nameEn: model.nameEn,
        nameAr: model.nameAr,
        active: model.active,
        disabled: disabledModels.has(model.id) || !model.active,
        added: addedIds.has(model.id),
      }));
      return {
        id: item.id,
        slug: item.slug,
        nameEn: item.nameEn,
        nameAr: item.nameAr,
        status: item.status,
        countryCode: item.countryCode ?? null,
        countryNameEn: item.countryNameEn ?? null,
        countryNameAr: item.countryNameAr ?? null,
        disabled: overrides.disabledMakeSlugs.includes(item.slug),
        modelCount: models.length,
        models,
      };
    }),
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
    toggleModelId?: string;
    enabled?: boolean;
    addModel?: {
      makeSlug?: string;
      makeName?: string;
      nameEn?: string;
      nameAr?: string;
      sourceSuggestionId?: string;
    };
  } | null;

  const current = await getVehicleCatalogOverrides();
  applyVehicleCatalogOverridesRuntime(current);
  let disabledMakeSlugs = [...current.disabledMakeSlugs];
  let disabledModelIds = [...current.disabledModelIds];
  let addedModels = [...current.addedModels];

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
  if (body?.toggleModelId) {
    const modelId = body.toggleModelId.trim();
    const enabled = body.enabled !== false;
    disabledModelIds = enabled
      ? disabledModelIds.filter((item) => item !== modelId)
      : [...new Set([...disabledModelIds, modelId])];
  }

  if (body?.addModel) {
    const make =
      (body.addModel.makeSlug
        ? getVehicleMakeBySlug(body.addModel.makeSlug)
        : undefined) ??
      (body.addModel.makeName
        ? getVehicleMakeByName(
            resolveVehicleMakeName(body.addModel.makeName) ??
              body.addModel.makeName,
          )
        : undefined);
    const nameEn = String(body.addModel.nameEn ?? "").trim();
    if (!make || !nameEn) {
      return NextResponse.json(
        { error: "INVALID_MODEL_INPUT" },
        { status: 400 },
      );
    }
    const slug = slugifyVehicleModelName(nameEn);
    if (!slug) {
      return NextResponse.json({ error: "INVALID_MODEL_SLUG" }, { status: 400 });
    }
    const existing = getVehicleModelsForMake(make.nameEn, {
      includeInactive: true,
    });
    if (
      existing.some(
        (model) =>
          model.slug === slug ||
          model.nameEn.toLowerCase() === nameEn.toLowerCase(),
      )
    ) {
      return NextResponse.json({ error: "MODEL_EXISTS" }, { status: 409 });
    }
    if (
      addedModels.some(
        (row) => row.makeSlug === make.slug && row.slug === slug,
      )
    ) {
      return NextResponse.json({ error: "MODEL_EXISTS" }, { status: 409 });
    }
    const row: AddedVehicleModel = {
      id: `model-added-${make.slug}-${slug}`,
      makeSlug: make.slug,
      slug,
      nameEn,
      nameAr: String(body.addModel.nameAr ?? nameEn).trim() || nameEn,
      active: true,
      sortOrder: 9000 + addedModels.length,
      createdAt: new Date().toISOString(),
      sourceSuggestionId: body.addModel.sourceSuggestionId,
    };
    addedModels = [...addedModels, row];
  }

  const saved = await saveVehicleCatalogOverrides({
    disabledMakeSlugs,
    disabledModelIds,
    addedModels,
  });
  applyVehicleCatalogOverridesRuntime(saved);

  return NextResponse.json({
    ok: true,
    overrides: saved,
    stats: vehicleCatalogStats(),
  });
}
