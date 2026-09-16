import type { CategoryFieldOption } from "@/types";

/** Practical UAE used/new market year range: 1990 → current year + 1. */
export const VEHICLE_YEAR_MIN = 1990;

export function getVehicleYearMax(now = new Date()): number {
  return now.getFullYear() + 1;
}

/** Dynamic year options — do not hardcode year arrays in UI components. */
export function vehicleYearOptions(now = new Date()): CategoryFieldOption[] {
  const max = getVehicleYearMax(now);
  const length = max - VEHICLE_YEAR_MIN + 1;
  return Array.from({ length }, (_, index) => {
    const year = String(max - index);
    return { label: year, value: year };
  });
}

/** Canonical UAE regional specification options (AR labels = stored values). */
export const REGIONAL_SPEC_OPTIONS: CategoryFieldOption[] = [
  { label: "خليجي", value: "خليجي" },
  { label: "أمريكي", value: "أمريكي" },
  { label: "كندي", value: "كندي" },
  { label: "أوروبي", value: "أوروبي" },
  { label: "ياباني", value: "ياباني" },
  { label: "كوري", value: "كوري" },
  { label: "أخرى", value: "أخرى" },
];

export const VEHICLE_BODY_TYPE_OPTIONS: CategoryFieldOption[] = [
  { label: "SUV", value: "SUV" },
  { label: "سيدان", value: "سيدان" },
  { label: "كوبيه", value: "كوبيه" },
  { label: "هاتشباك", value: "هاتشباك" },
  { label: "قابل للتحويل", value: "قابل للتحويل" },
  { label: "واجن", value: "واجن" },
  { label: "بيك أب", value: "بيك أب" },
  { label: "فان", value: "فان" },
  { label: "ميني فان", value: "ميني فان" },
  { label: "تجاري", value: "تجاري" },
  { label: "أخرى", value: "أخرى" },
];

export const VEHICLE_DRIVETRAIN_OPTIONS: CategoryFieldOption[] = [
  { label: "دفع أمامي", value: "FWD" },
  { label: "دفع خلفي", value: "RWD" },
  { label: "دفع رباعي AWD", value: "AWD" },
  { label: "دفع رباعي 4WD", value: "4WD" },
];

export const VEHICLE_TRANSMISSION_OPTIONS: CategoryFieldOption[] = [
  { label: "أوتوماتيك", value: "أوتوماتيك" },
  { label: "يدوي", value: "يدوي" },
  { label: "CVT", value: "CVT" },
  { label: "DCT", value: "DCT" },
  { label: "أخرى", value: "أخرى" },
];

export const VEHICLE_FUEL_OPTIONS: CategoryFieldOption[] = [
  { label: "بنزين", value: "بنزين" },
  { label: "ديزل", value: "ديزل" },
  { label: "هجين", value: "هجين" },
  { label: "هجين قابل للشحن", value: "هجين قابل للشحن" },
  { label: "كهربائي", value: "كهربائي" },
  { label: "أخرى", value: "أخرى" },
];
