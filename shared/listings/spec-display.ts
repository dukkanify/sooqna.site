import { getCategoryFields } from "@/shared/constants/category-fields";
import {
  getFormTemplateFields,
  resolveCategoryFeatureProfile,
} from "@/shared/constants/category-feature-profiles";
import { humanizeSpecKey, translateSpecValueToken } from "@/shared/listings/spec-labels";
import type { CategoryFieldDefinition } from "@/types";

export type DisplaySpecEntry = {
  key: string;
  label: string;
  value: string;
};

function fieldByKey(
  fields: CategoryFieldDefinition[],
  key: string,
): CategoryFieldDefinition | undefined {
  return fields.find((field) => field.key === key);
}

function optionLabel(
  field: CategoryFieldDefinition | undefined,
  raw: string,
): string | undefined {
  if (!field?.options?.length) return undefined;
  const match = field.options.find(
    (option) => option.value === raw || option.value.toLowerCase() === raw.toLowerCase(),
  );
  return match?.label;
}

function resolveField(categoryId: string, key: string): CategoryFieldDefinition | undefined {
  const direct = fieldByKey(getCategoryFields(categoryId), key);
  if (direct) return direct;
  const template = fieldByKey(
    getFormTemplateFields(resolveCategoryFeatureProfile(categoryId), categoryId),
    key,
  );
  return template;
}

/** Arabic label for a spec key — never a raw API/database identifier. */
export function formatSpecLabel(categoryId: string, key: string): string {
  const field = resolveField(categoryId, key);
  if (field?.label) return field.label;
  return humanizeSpecKey(key);
}

function formatScalarValue(
  categoryId: string,
  key: string,
  value: string | number | boolean,
): string {
  if (typeof value === "boolean") {
    return value ? "نعم" : "لا";
  }
  if (key === "area" || key === "areaSqft") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return `${numeric.toLocaleString("en-AE")} قدم مربع`;
    }
  }
  if (key === "mileage") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return `${numeric.toLocaleString("en-AE")} كم`;
    }
    return `${value} كم`;
  }
  if (
    (key === "availabilityDate" || key === "expectedHandoverDate" || key === "purchaseDate") &&
    typeof value === "string"
  ) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toLocaleDateString("ar-AE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  const raw = String(value).trim();
  const fromOptions = optionLabel(resolveField(categoryId, key), raw);
  if (fromOptions) return fromOptions;
  return translateSpecValueToken(raw);
}

/** Arabic (or already-localized) value for a stored spec. */
export function formatSpecValue(
  categoryId: string,
  key: string,
  value: unknown,
): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => formatScalarValue(categoryId, key, item as string | number | boolean))
      .filter(Boolean)
      .join(" · ");
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return formatScalarValue(categoryId, key, value);
  }
  return translateSpecValueToken(String(value));
}

export function formatSpecEntry(
  categoryId: string,
  key: string,
  value: unknown,
): DisplaySpecEntry {
  return {
    key,
    label: formatSpecLabel(categoryId, key),
    value: formatSpecValue(categoryId, key, value),
  };
}
