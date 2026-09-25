import type { CategoryFieldDefinition, CategorySpecs, ListingCondition } from "@/types";
import {
  getCategoryFields,
} from "@/shared/constants/category-fields";

export type CategoryFormResult = {
  categorySpecs: CategorySpecs;
  errors: Record<string, string>;
  features: string[];
  negotiable?: boolean;
  title: string;
  condition: ListingCondition;
  city: string;
  emirate?: string;
  /** Jobs (and similar) skip AED price — use salary in specs instead. */
  skipPrice?: boolean;
};

function readFieldValue(
  formData: FormData,
  field: CategoryFieldDefinition,
): string | string[] {
  if (field.type === "checkbox-group") {
    return formData.getAll(`spec_${field.key}`).map(String);
  }
  return String(formData.get(`spec_${field.key}`) ?? "").trim();
}

function hasFieldValue(value: string | string[]): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value.length > 0;
}

function normalizeCondition(value: string): ListingCondition | null {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "new" ||
    value === "جديد" ||
    value === "جديدة"
  ) {
    return "new";
  }
  if (
    normalized === "excellent" ||
    value === "ممتاز" ||
    value === "ممتازة"
  ) {
    return "excellent";
  }
  if (
    normalized === "refurbished" ||
    value === "مجدّد" ||
    value === "مجدد" ||
    value === "مجددة"
  ) {
    return "refurbished";
  }
  if (
    normalized === "for_parts" ||
    value === "للقطع" ||
    value === "قطع غيار"
  ) {
    return "for_parts";
  }
  if (
    normalized === "not_working" ||
    value === "لا يعمل" ||
    value === "لا تعمل"
  ) {
    return "not_working";
  }
  if (
    normalized === "used" ||
    value === "مستعمل" ||
    value === "مستعملة"
  ) {
    return "used";
  }
  return null;
}

export function parseCategoryForm(
  formData: FormData,
  categoryId: string,
  fieldsOverride?: CategoryFieldDefinition[],
): CategoryFormResult {
  const errors: Record<string, string> = {};
  const categorySpecs: CategorySpecs = {};
  let features: string[] = [];
  let condition: ListingCondition | null = null;
  let city = "";
  let emirate: string | undefined;
  const isJobs = categoryId === "jobs";
  const isFood = categoryId === "food";

  const fields =
    fieldsOverride && fieldsOverride.length > 0
      ? fieldsOverride
      : getCategoryFields(categoryId);

  if (fields.length === 0) {
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const cityId = String(formData.get("city") ?? "");

    if (title.length < 8) errors.title = "عنوان الإعلان يجب أن يكون 8 أحرف على الأقل.";
    if (description.length < 20) errors.description = "اكتب وصفاً لا يقل عن 20 حرفاً.";
    if (!Number.isFinite(price) || price <= 0) errors.price = "اكتب سعراً صحيحاً.";
    const rawCondition = String(formData.get("condition") ?? "").trim();
    const parsedCondition = normalizeCondition(rawCondition);
    if (!parsedCondition) {
      errors.condition = "اختر حالة المنتج.";
    }
    if (!cityId) {
      errors.city = "اختر الإمارة / المدينة.";
    }

    const negotiableCheckbox = String(formData.get("negotiable") ?? "") === "on";

    return {
      categorySpecs: {},
      errors,
      features: [],
      negotiable: negotiableCheckbox || undefined,
      title,
      condition: parsedCondition ?? "used",
      city: cityId,
      emirate: undefined,
    };
  }
  const visibilitySpecs: Record<string, string> = {};
  for (const field of fields) {
    if (field.type === "checkbox-group") continue;
    visibilitySpecs[field.key] = String(formData.get(`spec_${field.key}`) ?? "").trim();
  }

  for (const field of fields) {
    if (
      field.showWhen &&
      !field.showWhen.values.includes(visibilitySpecs[field.showWhen.key] ?? "")
    ) {
      continue;
    }

    const raw = readFieldValue(formData, field);

    if (field.type === "checkbox-group") {
      const values = raw as string[];
      if (field.key === "features" && values.length > 0) {
        features = values;
      }
      continue;
    }

    const value = raw as string;
    if (!hasFieldValue(value)) {
      if (field.required) {
        errors[field.key] = `${field.label} مطلوب.`;
      }
      continue;
    }

    if (field.key === "condition") {
      const parsed = normalizeCondition(value);
      if (!parsed) {
        errors[field.key] = "اختر حالة المنتج.";
      } else {
        condition = parsed;
        categorySpecs.condition = value;
      }
    } else if (field.key === "city") {
      city = value;
    } else if (field.key === "emirate") {
      emirate = value;
    } else if (field.key === "location" && isJobs) {
      city = value;
      categorySpecs.location = value;
    } else if (field.type === "number") {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        errors[field.key] = `${field.label} يجب أن يكون رقماً.`;
      } else {
        categorySpecs[field.key] = numeric;
      }
    } else {
      categorySpecs[field.key] = value;
    }
  }

  // Food / jobs: never treat as product New/Used condition for display.
  if (isFood || isJobs) {
    condition = "used";
    delete categorySpecs.condition;
  } else if (!condition) {
    const hasConditionField = fields.some((field) => field.key === "condition");
    if (hasConditionField) {
      errors.condition = "اختر حالة المنتج.";
    } else {
      condition = "used";
    }
  }

  const description = String(formData.get("description") ?? "").trim();
  if (description.length < 20) {
    errors.description = "اكتب وصفاً لا يقل عن 20 حرفاً.";
  }

  if (!isJobs) {
    const price = Number(formData.get("price") ?? 0);
    if (!Number.isFinite(price) || price <= 0) {
      errors.price = "اكتب سعراً صحيحاً أكبر من صفر.";
    }
  }

  const titleParts = fields
    .filter((field) => field.titlePart)
    .filter((field) => {
      if (!field.showWhen) return true;
      return field.showWhen.values.includes(visibilitySpecs[field.showWhen.key] ?? "");
    })
    .map((field) => categorySpecs[field.key])
    .filter((value) => hasFieldValue(String(value ?? "")));

  const generatedTitle = titleParts.join(" ").trim();
  const formTitle = String(formData.get("title") ?? "").trim();
  // Prefer the explicit title field when the seller fills it.
  const title = formTitle || generatedTitle;
  if (title.length < 8) {
    errors.title = formTitle
      ? "عنوان الإعلان يجب أن يكون 8 أحرف على الأقل."
      : "اكتب عنواناً واضحاً للإعلان (8 أحرف على الأقل).";
  }

  const negotiableFromFeatures = features.includes("قابل للتفاوض");
  if (negotiableFromFeatures) {
    features = features.filter((item) => item !== "قابل للتفاوض");
  }
  const negotiableCheckbox = String(formData.get("negotiable") ?? "") === "on";

  return {
    categorySpecs,
    errors,
    features,
    negotiable: negotiableFromFeatures || negotiableCheckbox || undefined,
    title,
    condition: condition ?? "used",
    city,
    emirate,
    skipPrice: isJobs,
  };
}
