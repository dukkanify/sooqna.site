import type { CategorySpecs, Listing } from "@/types";
import {
  canonicalizeEmirate,
  extractAreaLabel,
  inferEmirateFromArea,
  listingArea,
  listingEmirate,
} from "@/shared/listings/uae-emirate";

function text(value: unknown): string {
  if (value === undefined || value === null || typeof value === "boolean") {
    return "";
  }
  return String(value).trim();
}

function setIfEmpty(
  specs: CategorySpecs,
  key: string,
  value: unknown,
): void {
  if (text(specs[key])) return;
  const next = text(value);
  if (next) specs[key] = next;
}

function mapToOption(raw: string, options: string[]): string | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  const hit = options.find((option) => option === value);
  if (hit) return hit;
  const lower = value.toLowerCase();
  return options.find(
    (option) =>
      lower.includes(option.toLowerCase()) ||
      option.toLowerCase().includes(lower),
  );
}

const TRANSMISSION_OPTIONS = ["أوتوماتيك", "يدوي", "CVT", "DCT", "أخرى"];
const FUEL_OPTIONS = [
  "بنزين",
  "ديزل",
  "هجين",
  "هجين قابل للشحن",
  "كهربائي",
  "أخرى",
];
const REGIONAL_OPTIONS = [
  "خليجي",
  "أمريكي",
  "كندي",
  "أوروبي",
  "ياباني",
  "كوري",
  "أخرى",
];
const WARRANTY_OPTIONS = ["نعم", "لا"];
const ACCIDENT_OPTIONS = ["بدون حوادث", "حادث بسيط", "حادث كبير"];
const SERVICE_OPTIONS = ["وكالة كاملة", "صيانة دورية", "غير متوفر"];

function coerceMileage(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  return digits || raw.trim();
}

/**
 * Build categorySpecs the edit form can render.
 * Location/condition often live on the listing row, and older ads keep
 * nested carSpecs / realEstateSpecs / electronicsSpecs.
 */
export function hydrateCategorySpecsForEdit(
  listing: Pick<
    Listing,
    | "categorySpecs"
    | "emirate"
    | "city"
    | "area"
    | "carSpecs"
    | "realEstateSpecs"
    | "electronicsSpecs"
  > & {
    condition?: Listing["condition"];
  },
): CategorySpecs {
  const specs: CategorySpecs = { ...(listing.categorySpecs ?? {}) };

  const emirate =
    listingEmirate(listing) ||
    canonicalizeEmirate(text(specs.emirate)) ||
    canonicalizeEmirate(text(specs.city)) ||
    inferEmirateFromArea(text(specs.city)) ||
    inferEmirateFromArea(text(listing.area)) ||
    inferEmirateFromArea(text(listing.city));
  if (emirate) specs.emirate = emirate;

  const area =
    listingArea({ ...listing, emirate }) ||
    extractAreaLabel(text(specs.city), emirate) ||
    extractAreaLabel(text(specs.emirate), emirate);
  if (area && canonicalizeEmirate(area) !== emirate) {
    specs.city = area;
  }

  if (listing.condition) setIfEmpty(specs, "condition", listing.condition);

  const car = listing.carSpecs;
  if (car) {
    if (car.mileage) setIfEmpty(specs, "mileage", coerceMileage(car.mileage));
    const transmission = mapToOption(car.transmission, TRANSMISSION_OPTIONS);
    if (transmission) setIfEmpty(specs, "transmission", transmission);
    const fuel = mapToOption(car.fuel, FUEL_OPTIONS);
    if (fuel) setIfEmpty(specs, "fuelType", fuel);
    const regional = mapToOption(car.regionalSpecs, REGIONAL_OPTIONS);
    if (regional) setIfEmpty(specs, "regionalSpecs", regional);
    const accident = mapToOption(car.accidentHistory, ACCIDENT_OPTIONS);
    if (accident) setIfEmpty(specs, "accidentHistory", accident);
    const service = mapToOption(car.serviceHistory, SERVICE_OPTIONS);
    if (service) setIfEmpty(specs, "serviceHistory", service);
    const warranty = mapToOption(car.warranty, WARRANTY_OPTIONS);
    if (warranty) setIfEmpty(specs, "warranty", warranty);
    else if (/نعم|ساري|وكالة|ضمان/.test(car.warranty) && !/منتهي|لا/.test(car.warranty)) {
      setIfEmpty(specs, "warranty", "نعم");
    } else if (/لا|منتهي|بدون/.test(car.warranty)) {
      setIfEmpty(specs, "warranty", "لا");
    }
  }

  const realty = listing.realEstateSpecs;
  if (realty) {
    const { amenities, ...rest } = realty;
    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined || value === null) continue;
      setIfEmpty(specs, key, value);
    }
    if (amenities?.length && !text(specs.amenities)) {
      specs.amenities = amenities.join(" · ");
    }
  }

  const electronics = listing.electronicsSpecs;
  if (electronics) {
    for (const [key, value] of Object.entries(electronics)) {
      setIfEmpty(specs, key, value);
    }
    if (electronics.color) setIfEmpty(specs, "exteriorColor", electronics.color);
  }

  return specs;
}

export function mergeCategorySpecs(
  existing: CategorySpecs | undefined,
  parsed: CategorySpecs | undefined,
): CategorySpecs {
  const next: CategorySpecs = { ...(existing ?? {}) };
  for (const [key, value] of Object.entries(parsed ?? {})) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    next[key] = value;
  }
  return next;
}
