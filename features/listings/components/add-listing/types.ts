import type { ListingCondition } from "@/types";

export type AddListingErrors = {
  category?: string;
  contact?: string;
  description?: string;
  images?: string;
  package?: string;
  price?: string;
  subcategory?: string;
  submit?: string;
  title?: string;
};

export type ListingPreview = {
  city: string;
  /** Empty until the seller chooses — never seed New/Used. */
  condition?: ListingCondition | "";
  description: string;
  price: string;
  title: string;
  /** Jobs: salary. Quote services: حسب عرض سعر. Else AED. */
  priceMode?: "aed" | "salary" | "quote";
  hideCondition?: boolean;
  /** Price is open to offers — shown in preview when checked. */
  negotiable?: boolean;
};
