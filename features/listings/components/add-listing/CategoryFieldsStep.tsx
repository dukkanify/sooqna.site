import type { CategoryFieldsDefaults, CategoryFieldErrors } from "./CategoryFieldsForm";
import { CategoryFieldsForm } from "./CategoryFieldsForm";
import type { AddListingErrors, ListingPreview } from "./types";
import { inferListingFormSmartSpecs } from "@/shared/listings/listing-form-smart-defaults";

type CategoryFieldsStepProps = {
  categoryId: string;
  errors: AddListingErrors & CategoryFieldErrors;
  onPreviewChange?: (
    patch: Partial<ListingPreview>,
  ) => void;
  /** Optional step-1 subcategory; seeds related type / fuel fields when it matches. */
  subcategory?: string;
};

export function CategoryFieldsStep({
  categoryId,
  errors,
  onPreviewChange,
  subcategory = "",
}: CategoryFieldsStepProps) {
  if (!categoryId) {
    return null;
  }

  const smartSpecs = inferListingFormSmartSpecs({
    categoryId,
    subcategory,
  });
  const defaults: CategoryFieldsDefaults | undefined =
    Object.keys(smartSpecs).length > 0
      ? { categorySpecs: smartSpecs }
      : undefined;

  return (
    <CategoryFieldsForm
      key={`${categoryId}:${subcategory || "none"}`}
      categoryId={categoryId}
      defaults={defaults}
      errors={errors}
      heading="2. تفاصيل الإعلان"
      onPreviewChange={onPreviewChange}
      stepLabel="الخطوة 2"
      subcategory={subcategory}
    />
  );
}

export type { CategoryFieldsDefaults, CategoryFieldErrors };
