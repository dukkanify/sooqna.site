import { createPayloadCollectionStore } from "@/services/db/durable-json-collection";
import type {
  CategoryFieldDefinition,
  CategoryFieldShowWhen,
  CategoryFieldType,
} from "@/types/domain/category-fields";
import { getCategoryFields } from "@/shared/constants/category-fields";
import {
  getFormTemplateFields,
  resolveCategoryFeatureProfile,
} from "@/shared/constants/category-feature-profiles";
import { withImplicitOtherShowWhen } from "@/shared/listings/category-field-visibility";

export type StoredCategoryFormField = {
  id: string;
  categoryId: string;
  fieldKey: string;
  label: string;
  type: CategoryFieldType;
  required: boolean;
  enabled: boolean;
  sortOrder: number;
  placeholder?: string;
  note?: string;
  options?: { label: string; value: string }[];
  validation?: string;
  visibility?: string;
  showWhen?: CategoryFieldShowWhen;
  hideWhen?: CategoryFieldShowWhen;
  pattern?: string;
  patternMessage?: string;
  titlePart?: boolean;
  searchable?: boolean;
  updatedAt: string;
};

const store = createPayloadCollectionStore<StoredCategoryFormField>({
  table: "category_form_fields",
  fileName: "sooqna-category-form-fields.json",
});

function toDefinition(row: StoredCategoryFormField): CategoryFieldDefinition {
  return {
    key: row.fieldKey,
    label: row.label,
    type: row.type,
    required: row.required,
    placeholder: row.placeholder,
    note: row.note,
    options: row.options,
    showWhen: row.showWhen,
    hideWhen: row.hideWhen,
    pattern: row.pattern,
    patternMessage: row.patternMessage,
    titlePart: row.titlePart,
    searchable: row.searchable,
  };
}

export async function listCategoryFormFields(categoryId: string) {
  const rows = await store.listAll();
  return rows
    .filter((row) => row.categoryId === categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.fieldKey.localeCompare(b.fieldKey));
}

function defaultsForCategory(categoryId: string): CategoryFieldDefinition[] {
  const dynamic = getCategoryFields(categoryId);
  if (dynamic.length > 0) return dynamic;
  return getFormTemplateFields(
    resolveCategoryFeatureProfile(categoryId),
    categoryId,
  );
}

/** Resolved fields for Add/Edit Listing: DB config when present, else code defaults. */
export async function resolveCategoryFields(
  categoryId: string,
): Promise<CategoryFieldDefinition[]> {
  const defaults = defaultsForCategory(categoryId);
  const stored = await listCategoryFormFields(categoryId);
  const enabled = stored.filter((row) => row.enabled);
  if (enabled.length === 0) {
    if (defaults.length === 0) return [];
    return withImplicitOtherShowWhen(defaults);
  }
  const fromStore = enabled.map(toDefinition);
  // Append any newer code-default keys missing from durable admin config
  // (e.g. real-estate license fields) without overriding admin edits.
  // Also keep newer visibility rules (hideWhen/showWhen) on existing keys.
  const known = new Set(fromStore.map((field) => field.key));
  const missing = defaults.filter((field) => !known.has(field.key));
  // Car publish ease: keep secondary specs optional even if an older admin
  // snapshot still marked colors / warranty / regional specs as required.
  const carPublishOptional = new Set([
    "bodyType",
    "drivetrain",
    "engineSize",
    "regionalSpecs",
    "exteriorColor",
    "interiorColor",
    "warranty",
    "accidentHistory",
    "serviceHistory",
    "vin",
    "numberOfKeys",
    "features",
  ]);
  const withVisibility = fromStore.map((field) => {
    const fallback = defaults.find((item) => item.key === field.key);
    if (!fallback) return field;
    const forceOptional =
      categoryId === "cars" && carPublishOptional.has(field.key);
    return {
      ...field,
      required: forceOptional ? Boolean(fallback.required) : field.required,
      section: field.section ?? fallback.section,
      showWhen: field.showWhen ?? fallback.showWhen,
      hideWhen: field.hideWhen ?? fallback.hideWhen,
    };
  });
  const merged =
    missing.length === 0 ? withVisibility : [...withVisibility, ...missing];
  return withImplicitOtherShowWhen(merged);
}

export async function replaceCategoryFormFields(
  categoryId: string,
  fields: Omit<StoredCategoryFormField, "id" | "categoryId" | "updatedAt">[],
): Promise<StoredCategoryFormField[]> {
  const existing = await listCategoryFormFields(categoryId);
  for (const row of existing) {
    await store.removeById(row.id);
  }

  const now = new Date().toISOString();
  const saved: StoredCategoryFormField[] = [];
  for (const [index, field] of fields.entries()) {
    const record: StoredCategoryFormField = {
      id: `cff-${categoryId}-${field.fieldKey}-${Date.now()}-${index}`,
      categoryId,
      fieldKey: field.fieldKey.trim(),
      label: field.label.trim(),
      type: field.type,
      required: Boolean(field.required),
      enabled: field.enabled !== false,
      sortOrder: Number.isFinite(field.sortOrder) ? field.sortOrder : index,
      placeholder: field.placeholder,
      note: field.note,
      options: field.options,
      validation: field.validation,
      visibility: field.visibility,
      showWhen: field.showWhen,
      hideWhen: field.hideWhen,
      pattern: field.pattern,
      patternMessage: field.patternMessage,
      titlePart: field.titlePart,
      searchable: field.searchable,
      updatedAt: now,
    };
    await store.upsert(record);
    saved.push(record);
  }
  return saved.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function seedCategoryFormFromDefaults(categoryId: string) {
  const defaults = defaultsForCategory(categoryId);
  if (defaults.length === 0) return [];
  return replaceCategoryFormFields(
    categoryId,
    defaults.map((field, index) => ({
      fieldKey: field.key,
      label: field.label,
      type: field.type,
      required: Boolean(field.required),
      enabled: true,
      sortOrder: index,
      placeholder: field.placeholder,
      note: field.note,
      options: field.options,
      showWhen: field.showWhen,
      hideWhen: field.hideWhen,
      pattern: field.pattern,
      patternMessage: field.patternMessage,
      titlePart: field.titlePart,
      searchable: field.searchable,
    })),
  );
}
