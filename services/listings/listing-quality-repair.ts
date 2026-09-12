import type { Listing } from "@/types";
import { galleryForListingProduct } from "@/shared/constants/listing-product-media";

/**
 * Repair known poor-quality account listings that slipped into production
 * (placeholder prices, keyboard-mash areas, mismatched car titles).
 */
export function repairPoorQualityListing(listing: Listing): Listing | null {
  const titleBlob = `${listing.title} ${listing.titleEnglish ?? ""}`;
  const isPatrolDraft =
    listing.categoryId === "cars" &&
    /patrol/i.test(titleBlob) &&
    (listing.price < 10_000 ||
      /زطذ|asdf|test|xxx/i.test(`${listing.area ?? ""} ${listing.city}`) ||
      /toyota\s*patrol/i.test(titleBlob));

  if (!isPatrolDraft) return null;

  const images = galleryForListingProduct({
    categoryId: "cars",
    count: 4,
    imageCategory: "cars",
    seed: `repair-${listing.id}`,
    title: "نيسان باترول 2026",
    titleEnglish: "Nissan Patrol 2026",
  });

  return {
    ...listing,
    title: "نيسان باترول SE 2026 — فل أوبشن",
    titleEnglish: "Nissan Patrol 2026 SE — Full Option",
    description:
      "باترول 2026 مواصفات خليجية، فل أوبشن، ضمان الوكالة ساري، عداد وكالة، بدون حوادث. جاهز للمعاينة والتسجيل في دبي.",
    descriptionEnglish:
      "2026 Nissan Patrol GCC specs, full option, active dealer warranty, agency mileage, accident-free. Ready for viewing and registration in Dubai.",
    subcategory: "سيارات عائلية",
    price: 389_000,
    currency: "AED",
    condition: "new",
    city: "دبي",
    emirate: "دبي",
    area: "الخليج التجاري",
    country: "الإمارات العربية المتحدة",
    images,
    imageUrl: images[0],
    features: [
      "خليجي",
      "فل أوبشن",
      "ضمان وكالة",
      "عداد وكالة",
      "جاهز للتسجيل",
    ],
    categorySpecs: {
      ...(listing.categorySpecs ?? {}),
      brand: "Nissan",
      model: "Patrol",
      year: "2026",
      transmission: "أوتوماتيك",
      fuelType: "بنزين",
      mileage: "50",
      regionalSpecs: "خليجي",
    },
    carSpecs: {
      mileage: "50",
      transmission: "أوتوماتيك",
      fuel: "بنزين",
      warranty: "ضمان الوكالة",
      accidentHistory: "بدون حوادث",
      regionalSpecs: "خليجي",
      serviceHistory: "وكالة",
      vinAvailable: true,
    },
  };
}

export function repairPoorQualityListings(listings: Listing[]): {
  listings: Listing[];
  repaired: Listing[];
} {
  const repaired: Listing[] = [];
  const next = listings.map((listing) => {
    const fixed = repairPoorQualityListing(listing);
    if (!fixed) return listing;
    repaired.push(fixed);
    return fixed;
  });
  return { listings: next, repaired };
}
