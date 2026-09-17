import type { Category, CategoryFieldDefinition, CategoryFieldOption } from "@/types";
import { getCategoryFields } from "@/shared/constants/category-fields";
import { getBrandOptionsForCategory } from "@/shared/constants/product-brands";
import { getModelsForBrand } from "@/shared/constants/product-brand-models";
import { vehicleYearOptions } from "@/shared/vehicles";

export const SEARCH_YEAR_OPTIONS: CategoryFieldOption[] = vehicleYearOptions();

/** Exact spec keys shown in search, sourced from real category field definitions. */
export const CATEGORY_SEARCH_KEYS: Record<string, readonly string[]> = {
  cars: [
    "brand",
    "model",
    "year",
    "mileage",
    "condition",
    "regionalSpecs",
    "bodyType",
    "transmission",
    "fuelType",
    "drivetrain",
  ],
  mobiles: ["brand", "model", "storage"],
  electronics: ["brand", "model", "warranty"],
  "real-estate": [
    "purpose",
    "propertyType",
    "developer",
    "bedrooms",
    "bathrooms",
    "area",
    "furnished",
  ],
  jobs: ["listingType", "position", "employmentType", "experience", "salary", "location"],
  services: ["serviceCategory", "coverageArea"],
  furniture: ["furnitureType", "furnitureTypeOther", "material"],
  food: ["saleType", "cuisine", "portion", "delivery", "freshness", "unitPrice"],
};

const SKIP_FIELD_TYPES = new Set(["textarea", "checkbox-group", "date"]);
const SKIP_FIELD_KEYS = new Set([
  "vin",
  "numberOfKeys",
  "purchaseDate",
  "accessories",
  "accessoriesIncluded",
  "batteryHealth",
  "features",
  "emirate",
  "city",
  "modelOther",
  "exteriorColorOther",
  "interiorColorOther",
]);

const RANGE_KEYS = new Set(["year", "mileage", "bedrooms", "bathrooms", "area"]);
const CASCADE_CHILD: Record<string, string> = { brand: "model" };

export type SearchRangeKey = "year" | "mileage" | "bedrooms" | "bathrooms" | "area";

export function isSearchRangeKey(key: string): key is SearchRangeKey {
  return RANGE_KEYS.has(key);
}

export function cascadeChildKey(parentKey: string): string | undefined {
  return CASCADE_CHILD[parentKey];
}

export function getCategorySearchFields(categoryId: string): CategoryFieldDefinition[] {
  const defined = getCategoryFields(categoryId);
  const allow = CATEGORY_SEARCH_KEYS[categoryId];
  if (allow) {
    return defined.filter((field) => allow.includes(field.key));
  }
  return defined.filter(
    (field) =>
      !SKIP_FIELD_TYPES.has(field.type) &&
      !SKIP_FIELD_KEYS.has(field.key) &&
      (field.type === "select" ||
        field.type === "combobox" ||
        field.searchable === true),
  );
}

export function fieldVisibleForSpecs(
  field: CategoryFieldDefinition,
  specs: Record<string, string>,
): boolean {
  if (!field.showWhen) return true;
  const current = specs[field.showWhen.key] ?? "";
  return field.showWhen.values.includes(current);
}

export function optionsForSearchField(
  categoryId: string,
  field: CategoryFieldDefinition,
  specs: Record<string, string>,
): CategoryFieldOption[] {
  if (field.key === "brand") {
    const brands = getBrandOptionsForCategory(categoryId);
    if (brands.length > 0) return brands;
  }
  if (field.key === "model" && (categoryId === "cars" || categoryId === "mobiles" || categoryId === "electronics")) {
    return getModelsForBrand(categoryId, specs.brand);
  }
  if (field.key === "year") return SEARCH_YEAR_OPTIONS;
  return field.options ?? [];
}

export function subcategoryFilterLabel(categoryId: string): string {
  if (categoryId === "electronics") return "النوع";
  if (categoryId === "services") return "تصنيف الخدمة";
  if (categoryId === "jobs") return "التخصص";
  return "التصنيف الفرعي";
}

export function categoryHasSubcategoryFilter(category: Category | undefined): boolean {
  return Boolean(category?.subcategories?.length);
}

export function auditedCategoryIds(categories: Category[]): string[] {
  return categories.map((category) => category.id);
}
