import type { CategoryFieldsDefaults, CategoryFieldErrors } from "./CategoryFieldsForm";
import { CategoryFieldsForm } from "./CategoryFieldsForm";
import type { AddListingErrors, ListingPreview } from "./types";

type CategoryFieldsStepProps = {
  categoryId: string;
  errors: AddListingErrors & CategoryFieldErrors;
  onPreviewChange?: (
    patch: Partial<ListingPreview>,
  ) => void;
};

export function CategoryFieldsStep({
  categoryId,
  errors,
  onPreviewChange,
}: CategoryFieldsStepProps) {
  if (!categoryId) {
    return null;
  }

  return (
    <CategoryFieldsForm
      key={categoryId}
      categoryId={categoryId}
      errors={errors}
      heading="2. تفاصيل الإعلان"
      onPreviewChange={onPreviewChange}
      stepLabel="الخطوة 2"
    />
  );
}

export type { CategoryFieldsDefaults, CategoryFieldErrors };
