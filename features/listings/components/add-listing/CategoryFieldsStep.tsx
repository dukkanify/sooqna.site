import type { CategoryFieldsDefaults, CategoryFieldErrors } from "./CategoryFieldsForm";
import { CategoryFieldsForm } from "./CategoryFieldsForm";
import type { AddListingErrors, ListingPreview } from "./types";

const PET_ANIMAL_TYPES = ["قطط", "كلاب", "طيور", "مستلزمات"] as const;
const FURNITURE_TYPES = ["غرف نوم", "كنب", "طاولات طعام", "أثاث خارجي"] as const;
const GOODS_CATEGORY_IDS = ["fashion", "kids", "sports", "books"] as const;

type CategoryFieldsStepProps = {
  categoryId: string;
  errors: AddListingErrors & CategoryFieldErrors;
  onPreviewChange?: (
    patch: Partial<ListingPreview>,
  ) => void;
  /** Optional step-1 subcategory; seeds type fields when it matches. */
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
  const furnitureType =
    categoryId === "furniture" &&
    (FURNITURE_TYPES as readonly string[]).includes(subcategory)
      ? subcategory
      : "";
  const goodsItemType =
    (GOODS_CATEGORY_IDS as readonly string[]).includes(categoryId) && subcategory
      ? subcategory
      : "";

  const defaults: CategoryFieldsDefaults | undefined = petsAnimalType
    ? { categorySpecs: { animalType: petsAnimalType } }
    : furnitureType
      ? { categorySpecs: { furnitureType } }
      : goodsItemType
        ? { categorySpecs: { itemType: goodsItemType } }
        : undefined;

  return (
    <CategoryFieldsForm
      key={`${categoryId}:${subcategory || petsAnimalType || furnitureType || goodsItemType || "none"}`}
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
