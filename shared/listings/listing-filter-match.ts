import type { Listing } from "@/types";
import { listingMatchesQuery } from "@/shared/listings/listing-specs";

function listingMatchesEmirate(listing: Listing, emirate: string): boolean {
  if (!emirate) return true;
  return (
    listing.emirate === emirate ||
    listing.city === emirate ||
    listing.categorySpecs?.emirate === emirate ||
    listing.categorySpecs?.city === emirate
  );
}

const SPEC_ALIASES: Record<string, string[]> = {
  fuelType: ["fuelType", "fuel"],
  fuel: ["fuelType", "fuel"],
  area: ["area", "areaSqft", "city"],
  storage: ["storage"],
  mileage: ["mileage"],
  transmission: ["transmission"],
  bedrooms: ["bedrooms"],
  bathrooms: ["bathrooms"],
  furnished: ["furnished"],
  developer: ["developer"],
  warranty: ["warranty"],
  condition: ["condition"],
};

const VALUE_ALIASES: Record<string, readonly string[]> = {
  كهربائي: ["كهربائي", "كهرباء", "electric"],
  كهرباء: ["كهربائي", "كهرباء", "electric"],
  "256 gb": ["256 gb", "256gb"],
  "128 gb": ["128 gb", "128gb"],
  "64 gb": ["64 gb", "64gb"],
  "512 gb": ["512 gb", "512gb"],
  "1 tb": ["1 tb", "1tb"],
};

export function normalizeSpecText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function compactSpecText(value: string): string {
  return normalizeSpecText(value).replace(/\s+/g, "");
}

export function specValuesEqual(stored: string, wanted: string): boolean {
  const a = normalizeSpecText(stored);
  const b = normalizeSpecText(wanted);
  if (!a || !b) return false;
  if (a === b) return true;
  if (compactSpecText(a) === compactSpecText(b)) return true;
  const aliases = VALUE_ALIASES[b] ?? VALUE_ALIASES[a];
  if (!aliases) return false;
  const compactAliases = aliases.map(compactSpecText);
  return compactAliases.includes(compactSpecText(a)) && compactAliases.includes(compactSpecText(b));
}

function nestedRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function readRecordValue(record: Record<string, unknown> | undefined, key: string): string | undefined {
  if (!record) return undefined;
  const value = record[key];
  if (value === undefined || value === null || typeof value === "boolean") return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

export function listingSpecValue(listing: Listing, key: string): string | undefined {
  const keys = SPEC_ALIASES[key] ?? [key];
  const specs = nestedRecord(listing.categorySpecs);
  for (const specKey of keys) {
    const fromSpecs = readRecordValue(specs, specKey);
    if (fromSpecs) return fromSpecs;
  }

  const car = nestedRecord(listing.carSpecs);
  const realEstate = nestedRecord(listing.realEstateSpecs);
  const electronics = nestedRecord(listing.electronicsSpecs);

  for (const specKey of keys) {
    const fromCar = readRecordValue(car, specKey === "fuelType" ? "fuel" : specKey);
    if (fromCar) return fromCar;
    const fromRe = readRecordValue(realEstate, specKey === "area" ? "areaSqft" : specKey);
    if (fromRe) return fromRe;
    const fromEl = readRecordValue(electronics, specKey);
    if (fromEl) return fromEl;
  }

  return undefined;
}

export function parseSpecNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const match = String(raw).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : undefined;
}

export type SmartListingFilters = {
  area?: string;
  categoryId?: string;
  categorySpecs?: Record<string, string>;
  city?: string;
  condition?: Listing["condition"];
  country?: string;
  maxPrice?: number;
  minPrice?: number;
  query?: string;
  specMax?: Record<string, number>;
  specMin?: Record<string, number>;
  subcategory?: string;
};

export function listingMatchesSmartFilters(
  listing: Listing,
  filters: SmartListingFilters,
): boolean {
  if (filters.categoryId && listing.categoryId !== filters.categoryId) return false;
  if (filters.condition && listing.condition !== filters.condition) return false;
  if (filters.country && listing.country !== filters.country) return false;
  if (filters.city && !listingMatchesEmirate(listing, filters.city)) return false;
  if (typeof filters.minPrice === "number" && listing.price < filters.minPrice) return false;
  if (typeof filters.maxPrice === "number" && listing.price > filters.maxPrice) return false;
  if (filters.query?.trim() && !listingMatchesQuery(listing, filters.query)) return false;

  if (filters.subcategory) {
    if (listing.subcategory !== filters.subcategory) return false;
  }

  if (filters.area?.trim()) {
    const wanted = filters.area.trim();
    const candidates = [
      listing.area,
      listingSpecValue(listing, "city"),
      listingSpecValue(listing, "community"),
      listingSpecValue(listing, "coverageArea"),
      listingSpecValue(listing, "location"),
    ].filter(Boolean) as string[];
    const hit = candidates.some(
      (value) => specValuesEqual(value, wanted) || normalizeSpecText(value).includes(normalizeSpecText(wanted)),
    );
    if (!hit) return false;
  }

  if (filters.categorySpecs) {
    for (const [key, wanted] of Object.entries(filters.categorySpecs)) {
      if (!wanted.trim()) continue;
      const stored = listingSpecValue(listing, key);
      if (!stored || !specValuesEqual(stored, wanted)) return false;
    }
  }

  if (filters.specMin) {
    for (const [key, min] of Object.entries(filters.specMin)) {
      if (!Number.isFinite(min)) continue;
      const stored = parseSpecNumber(listingSpecValue(listing, key));
      if (stored === undefined || stored < min) return false;
    }
  }

  if (filters.specMax) {
    for (const [key, max] of Object.entries(filters.specMax)) {
      if (!Number.isFinite(max)) continue;
      const stored = parseSpecNumber(listingSpecValue(listing, key));
      if (stored === undefined || stored > max) return false;
    }
  }

  return true;
}

export const SPEC_SQL_PATHS: Record<string, readonly string[]> = {
  brand: ["payload->'categorySpecs'->>'brand'"],
  model: ["payload->'categorySpecs'->>'model'"],
  year: ["payload->'categorySpecs'->>'year'"],
  fuelType: [
    "payload->'categorySpecs'->>'fuelType'",
    "payload->'categorySpecs'->>'fuel'",
    "payload->'carSpecs'->>'fuel'",
  ],
  transmission: [
    "payload->'categorySpecs'->>'transmission'",
    "payload->'carSpecs'->>'transmission'",
  ],
  mileage: [
    "payload->'categorySpecs'->>'mileage'",
    "payload->'carSpecs'->>'mileage'",
  ],
  storage: [
    "payload->'categorySpecs'->>'storage'",
    "payload->'electronicsSpecs'->>'storage'",
  ],
  condition: ["payload->'categorySpecs'->>'condition'", "payload->>'condition'"],
  propertyType: ["payload->'categorySpecs'->>'propertyType'"],
  purpose: ["payload->'categorySpecs'->>'purpose'"],
  bedrooms: [
    "payload->'categorySpecs'->>'bedrooms'",
    "payload->'realEstateSpecs'->>'bedrooms'",
  ],
  bathrooms: [
    "payload->'categorySpecs'->>'bathrooms'",
    "payload->'realEstateSpecs'->>'bathrooms'",
  ],
  area: [
    "payload->'categorySpecs'->>'area'",
    "payload->'realEstateSpecs'->>'areaSqft'",
  ],
  furnished: [
    "payload->'categorySpecs'->>'furnished'",
    "payload->'realEstateSpecs'->>'furnished'",
  ],
  developer: [
    "payload->'categorySpecs'->>'developer'",
    "payload->'realEstateSpecs'->>'developer'",
  ],
  listingType: ["payload->'categorySpecs'->>'listingType'"],
  position: ["payload->'categorySpecs'->>'position'"],
  employmentType: ["payload->'categorySpecs'->>'employmentType'"],
  experience: ["payload->'categorySpecs'->>'experience'"],
  salary: ["payload->'categorySpecs'->>'salary'"],
  location: ["payload->'categorySpecs'->>'location'"],
  availability: ["payload->'categorySpecs'->>'availability'"],
  serviceCategory: ["payload->'categorySpecs'->>'serviceCategory'"],
  coverageArea: ["payload->'categorySpecs'->>'coverageArea'"],
  furnitureType: ["payload->'categorySpecs'->>'furnitureType'"],
  furnitureTypeOther: ["payload->'categorySpecs'->>'furnitureTypeOther'"],
  material: ["payload->'categorySpecs'->>'material'"],
  saleType: ["payload->'categorySpecs'->>'saleType'"],
  cuisine: ["payload->'categorySpecs'->>'cuisine'"],
  portion: ["payload->'categorySpecs'->>'portion'"],
  delivery: ["payload->'categorySpecs'->>'delivery'"],
  freshness: ["payload->'categorySpecs'->>'freshness'"],
  unitPrice: ["payload->'categorySpecs'->>'unitPrice'"],
  warranty: [
    "payload->'categorySpecs'->>'warranty'",
    "payload->'electronicsSpecs'->>'warranty'",
    "payload->'carSpecs'->>'warranty'",
  ],
  company: ["payload->'categorySpecs'->>'company'"],
};

export function specMatchCandidates(wanted: string): string[] {
  const compact = compactSpecText(wanted);
  if (!compact) return [];
  const aliases = VALUE_ALIASES[normalizeSpecText(wanted)];
  if (aliases) return [...new Set(aliases.map(compactSpecText))];
  return [compact];
}

export function isSafeSpecKey(key: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key);
}

export function specSqlPaths(key: string): readonly string[] {
  if (!isSafeSpecKey(key)) return [];
  return SPEC_SQL_PATHS[key] ?? [`payload->'categorySpecs'->>'${key}'`];
}
