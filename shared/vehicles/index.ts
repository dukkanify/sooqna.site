import catalogJson from "@/shared/vehicles/catalog.json";
import { VEHICLE_MAKE_ALIASES } from "@/shared/vehicles/aliases";
import type {
  VehicleCatalog,
  VehicleMake,
  VehicleModel,
} from "@/shared/vehicles/types";
import type { CategoryFieldOption } from "@/types";

export {
  REGIONAL_SPEC_OPTIONS,
  VEHICLE_BODY_TYPE_OPTIONS,
  VEHICLE_DRIVETRAIN_OPTIONS,
  VEHICLE_FUEL_OPTIONS,
  VEHICLE_TRANSMISSION_OPTIONS,
  VEHICLE_YEAR_MIN,
  getVehicleYearMax,
  vehicleYearOptions,
} from "@/shared/vehicles/year-options";

const catalog = catalogJson as VehicleCatalog;

const OTHER_OPTION: CategoryFieldOption = { label: "أخرى", value: "أخرى" };

type RuntimeAddedModel = {
  id: string;
  makeSlug: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  active: boolean;
  sortOrder: number;
};

let disabledMakeSlugs = new Set<string>();
let disabledModelIds = new Set<string>();
let addedModels: RuntimeAddedModel[] = [];

export function setVehicleCatalogOverrides(input: {
  disabledMakeSlugs?: string[];
  disabledModelIds?: string[];
  addedModels?: RuntimeAddedModel[];
}): void {
  disabledMakeSlugs = new Set(input.disabledMakeSlugs ?? []);
  disabledModelIds = new Set(input.disabledModelIds ?? []);
  addedModels = Array.isArray(input.addedModels) ? input.addedModels : [];
}

export function getVehicleCatalog(): VehicleCatalog {
  return catalog;
}

export function getVehicleMakes(options?: {
  includeDisabled?: boolean;
}): VehicleMake[] {
  const includeDisabled = options?.includeDisabled === true;
  return catalog.makes
    .filter((make) => {
      if (includeDisabled) return true;
      if (make.status !== "active") return false;
      if (disabledMakeSlugs.has(make.slug)) return false;
      return true;
    })
    .slice()
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn),
    );
}

export function getVehicleMakeBySlug(slug: string): VehicleMake | undefined {
  const key = slug.trim().toLowerCase();
  return catalog.makes.find((make) => make.slug === key);
}

export function resolveVehicleMakeName(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();

  const direct = catalog.makes.find(
    (make) => make.nameEn.toLowerCase() === trimmed.toLowerCase(),
  );
  if (direct) return direct.nameEn;

  const bySlug = getVehicleMakeBySlug(
    trimmed.toLowerCase().replace(/\s+/g, "-"),
  );
  if (bySlug) return bySlug.nameEn;

  const alias = VEHICLE_MAKE_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  const arHit = catalog.makes.find((make) => make.nameAr === trimmed);
  if (arHit) return arHit.nameEn;

  return null;
}

export function getVehicleMakeByName(name: string): VehicleMake | undefined {
  const canonical = resolveVehicleMakeName(name);
  if (!canonical) return undefined;
  return catalog.makes.find(
    (make) => make.nameEn.toLowerCase() === canonical.toLowerCase(),
  );
}

export function getVehicleModelsForMake(
  makeRef: string | undefined,
  options?: { includeInactive?: boolean },
): VehicleModel[] {
  if (!makeRef?.trim()) return [];
  const make =
    getVehicleMakeBySlug(makeRef) ??
    getVehicleMakeByName(makeRef) ??
    getVehicleMakeByName(resolveVehicleMakeName(makeRef) ?? "");
  if (!make) return [];
  const includeInactive = options?.includeInactive === true;
  const fromCatalog = catalog.models.filter((model) => {
    if (model.makeId !== make.id) return false;
    if (!includeInactive && !model.active) return false;
    if (!includeInactive && disabledModelIds.has(model.id)) return false;
    if (!includeInactive && disabledMakeSlugs.has(make.slug)) return false;
    return true;
  });

  const fromOverrides = addedModels
    .filter((row) => row.makeSlug === make.slug)
    .filter((row) => {
      if (!includeInactive && !row.active) return false;
      if (!includeInactive && disabledModelIds.has(row.id)) return false;
      if (!includeInactive && disabledMakeSlugs.has(make.slug)) return false;
      return true;
    })
    .map(
      (row): VehicleModel => ({
        id: row.id,
        makeId: make.id,
        makeSlug: make.slug,
        slug: row.slug,
        nameEn: row.nameEn,
        nameAr: row.nameAr,
        active: row.active,
        sortOrder: row.sortOrder,
      }),
    );

  // Prefer catalog rows when slug collides with an override.
  const catalogSlugs = new Set(fromCatalog.map((model) => model.slug));
  const merged = [
    ...fromCatalog,
    ...fromOverrides.filter((model) => !catalogSlugs.has(model.slug)),
  ];

  return merged
    .slice()
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.nameEn.localeCompare(b.nameEn),
    );
}

export function vehicleMakeOptions(): CategoryFieldOption[] {
  return getVehicleMakes().map((make) => ({
    // Arabic-first label for RTL UI; English kept for search + stored value.
    label:
      make.nameAr && make.nameAr !== make.nameEn
        ? `${make.nameAr} · ${make.nameEn}`
        : make.nameEn,
    value: make.nameEn,
  }));
}

export function vehicleModelOptionsForMake(
  makeName: string | undefined,
): CategoryFieldOption[] {
  const models = getVehicleModelsForMake(makeName);
  if (models.length === 0) return [OTHER_OPTION];
  return [
    ...models.map((model) => ({
      label: model.nameEn,
      value: model.nameEn,
    })),
    OTHER_OPTION,
  ];
}

export function modelBelongsToMake(
  makeName: string | undefined,
  modelName: string | undefined,
): boolean {
  if (!makeName?.trim() || !modelName?.trim()) return false;
  if (modelName.trim() === "أخرى") return true;
  const models = getVehicleModelsForMake(makeName);
  return models.some(
    (model) =>
      model.nameEn.toLowerCase() === modelName.trim().toLowerCase(),
  );
}

export function vehicleCatalogStats() {
  const makes = catalog.makes;
  const models = catalog.models;
  const activeMakes = getVehicleMakes();
  const orphanModels = models.filter(
    (model) => !makes.some((make) => make.id === model.makeId),
  );
  const duplicateMakeSlugs =
    makes.length - new Set(makes.map((make) => make.slug)).size;
  const duplicateModelKeys =
    models.length -
    new Set(models.map((model) => `${model.makeId}::${model.slug}`)).size;
  const makesWithCountry = makes.filter((make) => Boolean(make.countryCode)).length;
  const addedActive = addedModels.filter((row) => row.active).length;
  return {
    makesTotal: makes.length,
    makesActive: activeMakes.length,
    makesWithCountry,
    modelsTotal: models.length + addedModels.length,
    modelsAdded: addedModels.length,
    modelsAddedActive: addedActive,
    orphanModels: orphanModels.length,
    duplicateMakeSlugs,
    duplicateModelKeys,
  };
}

/** Map legacy listing brand strings; unmatched stay as-is and are flagged. */
export function migrateLegacyMakeValue(raw: string): {
  canonical: string | null;
  status: "MAPPED" | "MANUAL_REVIEW";
  original: string;
} {
  const original = raw.trim();
  const canonical = resolveVehicleMakeName(original);
  if (canonical) return { canonical, status: "MAPPED", original };
  return { canonical: null, status: "MANUAL_REVIEW", original };
}
