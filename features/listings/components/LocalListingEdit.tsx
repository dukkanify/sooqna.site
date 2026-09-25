"use client";

import { isDynamicCategory } from "@/shared/constants/category-fields";
import { CategoryFieldsForm } from "@/features/listings/components/add-listing/CategoryFieldsForm";
import { GenericListingFields } from "@/features/listings/components/GenericListingFields";
import { ListingMediaSection } from "@/features/listings/components/ListingMediaSection";
import {
  useEditListingForm,
  type EditListingMode,
} from "@/features/listings/components/useEditListingForm";
import type { Listing } from "@/types";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { FormMessage } from "@/shared/ui/FormMessage";
import { ListingDetailSkeleton } from "@/shared/ui/Skeleton";

type ListingEditFormProps = {
  listingId: string;
  initialListing?: Listing | null;
  mode?: EditListingMode;
};

export function ListingEditForm({
  listingId,
  initialListing,
  mode = "local",
}: ListingEditFormProps) {
  const {
    cancelHref,
    defaults,
    errors,
    existingImages,
    handleImageChange,
    handleSubmit,
    imagePreviews,
    isDynamic,
    isLoading,
    listing,
    saveMessage,
  } = useEditListingForm(listingId, { initialListing, mode });

  if (typeof window === "undefined") {
    return <ListingDetailSkeleton />;
  }

  if (!listing) {
    return (
      <EmptyState
        actionHref="/dashboard/listings"
        actionLabel="العودة إلى إعلاناتي"
        description={
          mode === "server"
            ? "الإعلان غير موجود أو لا تملك صلاحية تعديله."
            : "الإعلان غير موجود في هذا المتصفح. ربما تم حذفه أو لم يُحفظ بعد."
        }
        icon="search"
        title="الإعلان غير موجود"
      />
    );
  }

  const showContactInMedia = !isDynamicCategory(listing.categoryId);

  return (
    <form className="grid gap-6" noValidate onSubmit={handleSubmit}>
      {isDynamic ? (
        <CategoryFieldsForm
          categoryId={listing.categoryId}
          defaults={defaults}
          errors={errors}
          heading="تعديل تفاصيل الإعلان"
          showContact
        />
      ) : (
        <GenericListingFields errors={errors} listing={listing} />
      )}

      <ListingMediaSection
        defaultContact={listing.contactPhone}
        errors={errors}
        existingImages={existingImages}
        imagePreviews={imagePreviews}
        onImageChange={handleImageChange}
        showContact={showContactInMedia}
        title={isDynamic ? "الصور" : "الصور والتواصل"}
        videoUrl={listing.videoUrl}
      />

      {saveMessage ? (
        <FormMessage variant={saveMessage.includes("نجاح") ? "success" : "error"}>
          {saveMessage}
        </FormMessage>
      ) : null}

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <p className="text-sm font-medium text-muted">
          {mode === "server"
            ? "التغييرات تُحفظ في حسابك وتظهر فوراً في صفحة الإعلان وإعلاناتي."
            : "التغييرات ستظهر فوراً في صفحة الإعلان، إعلاناتي، ونتائج البحث."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button loading={isLoading} type="submit">
            حفظ التعديلات
          </Button>
          <Button href={cancelHref} variant="secondary">
            إلغاء
          </Button>
        </div>
      </Card>
    </form>
  );
}

/** @deprecated Prefer ListingEditForm — kept for local edit page imports. */
export function LocalListingEdit({ listingId }: { listingId: string }) {
  return <ListingEditForm listingId={listingId} mode="local" />;
}
