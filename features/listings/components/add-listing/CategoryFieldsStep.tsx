import type { CategoryFieldsDefaults, CategoryFieldErrors } from "./CategoryFieldsForm";
import { CategoryFieldsForm } from "./CategoryFieldsForm";
import type { AddListingErrors, ListingPreview } from "./types";

const PET_ANIMAL_TYPES = ["قطط", "كلاب", "طيور", "مستلزمات"] as const;

type CategoryFieldsStepProps = {
  categoryId: string;
  errors: AddListingErrors & CategoryFieldErrors;
  onPreviewChange?: (
    patch: Partial<ListingPreview>,
  ) => void;
  /** Optional step-1 subcategory; seeds pets animalType when it matches. */
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

  const petsAnimalType =
    categoryId === "pets" &&
    (PET_ANIMAL_TYPES as readonly string[]).includes(subcategory)
      ? subcategory
      : "";

  const defaults: CategoryFieldsDefaults | undefined = petsAnimalType
    ? { categorySpecs: { animalType: petsAnimalType } }
    : undefined;

  return (
    <CategoryFieldsForm
      key={`${categoryId}:${petsAnimalType || "none"}`}
      categoryId={categoryId}
      defaults={defaults}
      errors={errors}
      heading="2. تفاصيل الإعلان"
      onPreviewChange={onPreviewChange}
      stepLabel="الخطوة 2"
    />
  );
}

export type { CategoryFieldsDefaults, CategoryFieldErrors };
