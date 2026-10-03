import type { Listing } from "@/types";
import type { CategoryFieldsDefaults } from "./add-listing/CategoryFieldsForm";
import { hydrateCategorySpecsForEdit } from "@/shared/listings/listing-form-hydrate";

export function buildCategoryFieldsDefaults(listing: Listing): CategoryFieldsDefaults {
  return {
    categorySpecs: hydrateCategorySpecsForEdit(listing),
    condition: listing.condition,
    contactPhone: listing.contactPhone,
    description: listing.description,
    features: listing.features,
    negotiable: listing.negotiable,
    price: listing.price,
    title: listing.title,
  };
}

export { getListingImages } from "./listing-card.utils";
