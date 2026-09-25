"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useImagePreviews } from "./add-listing/useImagePreviews";
import { cities, countries } from "@/shared/constants/locations";
import { isDynamicCategory } from "@/shared/constants/category-fields";
import { STORAGE_EVENTS } from "@/shared/constants/brand";
import type { Listing } from "@/types";
import { getLocalListingById, saveLocalListing } from "@/services/storage";
import { uploadListingImages } from "@/services/upload";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import type { CategoryFieldErrors } from "./add-listing/CategoryFieldsForm";
import { parseCategoryForm } from "./add-listing/category-form-utils";
import { createListingSlug } from "./add-listing/utils";
import {
  buildCategoryFieldsDefaults,
  getListingImages,
} from "./listing-edit.utils";

export type EditListingMode = "local" | "server";

type UseEditListingFormOptions = {
  initialListing?: Listing | null;
  mode?: EditListingMode;
};

function readLocalListing(listingId: string): Listing | null {
  if (typeof window === "undefined") {
    return null;
  }
  return getLocalListingById(listingId) ?? null;
}

export function useEditListingForm(
  listingId: string,
  options: UseEditListingFormOptions = {},
) {
  const mode = options.mode ?? "local";
  const router = useRouter();
  const [localListing, setLocalListing] = useState<Listing | null>(() =>
    mode === "local" ? readLocalListing(listingId) : null,
  );
  const [serverListing, setServerListing] = useState<Listing | null>(
    () => options.initialListing ?? null,
  );
  const listing = mode === "server" ? serverListing : localListing;
  const [errors, setErrors] = useState<CategoryFieldErrors>({});
  const { handleImageChange: setImagePreviewsFromFiles, imageFiles, imagePreviews } =
    useImagePreviews();
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (mode !== "local") return;
    const sync = () => setLocalListing(readLocalListing(listingId));
    window.addEventListener(STORAGE_EVENTS.listingsChange, sync);
    return () => window.removeEventListener(STORAGE_EVENTS.listingsChange, sync);
  }, [listingId, mode]);

  const saveChanges = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const currentListing =
        mode === "server" ? serverListing : readLocalListing(listingId);
      if (!currentListing) {
        return;
      }

      const formData = new FormData(event.currentTarget);
      const categoryId = currentListing.categoryId;
      const contact = String(formData.get("contact") ?? "").trim();
      const videoUrl = String(formData.get("videoUrl") ?? "").trim();
      const parsed = parseCategoryForm(formData, categoryId);
      const nextErrors: CategoryFieldErrors = { ...parsed.errors };

      if (!/^(\+971|971|0)?5\d{8}$/.test(contact)) {
        nextErrors.contact = "اكتب رقم تواصل إماراتي صحيح.";
      }

      setErrors(nextErrors);
      setSaveMessage("");

      if (Object.keys(nextErrors).length > 0) {
        setSaveMessage("تأكد من صحة الحقول قبل الحفظ.");
        return;
      }

      const price = Number(formData.get("price") ?? 0);
      const description = String(formData.get("description") ?? "").trim();
      const existingImages = getListingImages(currentListing);
      const newImages =
        imageFiles.length > 0 ? await uploadListingImages(imageFiles) : [];
      const mergedImages = [...existingImages, ...newImages].slice(0, 6);

      const cityName = isDynamicCategory(categoryId)
        ? parsed.city
        : cities.find((city) => city.id === parsed.city)?.name ?? currentListing.city;

      const title = isDynamicCategory(categoryId)
        ? parsed.title
        : String(formData.get("title") ?? "").trim();

      const nextSlug = createListingSlug({
        id: currentListing.id,
        title,
        titleEnglish: currentListing.titleEnglish,
      });

      if (mode === "server") {
        const response = await fetch(`/api/listings/${currentListing.id}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            price,
            condition: parsed.condition,
            city: cityName,
            emirate: parsed.emirate,
            contactPhone: contact,
            imageUrl: mergedImages[0],
            images: mergedImages.length > 0 ? mergedImages : undefined,
            categorySpecs: isDynamicCategory(categoryId)
              ? parsed.categorySpecs
              : undefined,
            features: parsed.features.length > 0 ? parsed.features : [],
            negotiable: parsed.negotiable,
            videoUrl: videoUrl || "",
          }),
        });

        if (!response.ok) {
          setSaveMessage("تعذر حفظ التعديلات. حاول مرة أخرى.");
          return;
        }

        const payload = (await response.json().catch(() => null)) as {
          listing?: Listing;
        } | null;
        const saved = payload?.listing ?? {
          ...currentListing,
          title,
          slug: nextSlug,
          description,
          price,
          condition: parsed.condition,
          city: cityName,
          country: countries[0].name,
          imageUrl: mergedImages[0],
          images: mergedImages.length > 0 ? mergedImages : undefined,
          categorySpecs: isDynamicCategory(categoryId)
            ? parsed.categorySpecs
            : undefined,
          features: parsed.features.length > 0 ? parsed.features : undefined,
          negotiable: parsed.negotiable,
          emirate: parsed.emirate,
          contactPhone: contact,
          contactMethod: "both" as const,
          videoUrl: videoUrl || undefined,
        };

        saveLocalListing(saved);
        setServerListing(saved);
        setSaveMessage("تم حفظ التعديلات بنجاح.");
        router.push(`/listings/${saved.slug}`);
        router.refresh();
        return;
      }

      const updatedListing: Listing = {
        ...currentListing,
        title,
        slug: nextSlug,
        description,
        price,
        condition: parsed.condition,
        city: cityName,
        country: countries[0].name,
        imageUrl: mergedImages[0],
        images: mergedImages.length > 0 ? mergedImages : undefined,
        categorySpecs: isDynamicCategory(categoryId) ? parsed.categorySpecs : undefined,
        features: parsed.features.length > 0 ? parsed.features : undefined,
        negotiable: parsed.negotiable,
        emirate: parsed.emirate,
        contactPhone: contact,
        contactMethod: "both",
        videoUrl: videoUrl || undefined,
      };

      saveLocalListing(updatedListing);
      void fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing: updatedListing }),
      }).catch(() => undefined);
      setSaveMessage("تم حفظ التعديلات بنجاح.");
      router.push(`/listings/local/${currentListing.id}`);
    },
    [imageFiles, listingId, mode, router, serverListing],
  );

  const { isLoading, run: handleSubmit } = useAsyncAction(saveChanges);

  const handleImageChange = useCallback(
    (fileList: FileList | null, modeAppend: "append" | "replace" = "replace") => {
      const current =
        mode === "server" ? serverListing : readLocalListing(listingId);
      const existingCount = current ? getListingImages(current).length : 0;
      const maxNew = Math.max(0, 6 - existingCount);
      setImagePreviewsFromFiles(fileList, maxNew, modeAppend);
    },
    [listingId, mode, serverListing, setImagePreviewsFromFiles],
  );

  return {
    cancelHref:
      mode === "server" && listing
        ? `/listings/${listing.slug}`
        : `/listings/local/${listingId}`,
    defaults: listing ? buildCategoryFieldsDefaults(listing) : undefined,
    errors,
    existingImages: listing ? getListingImages(listing) : [],
    handleImageChange,
    handleSubmit,
    imagePreviews,
    isDynamic: listing ? isDynamicCategory(listing.categoryId) : false,
    isLoading,
    listing,
    saveMessage,
  };
}
