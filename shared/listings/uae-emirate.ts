import { EMIRATE_AREAS, areasForEmirate } from "@/shared/constants/emirate-areas";

/** Canonical Arabic emirate names in display order. */
export const UAE_EMIRATE_NAMES = [
  "دبي",
  "أبوظبي",
  "الشارقة",
  "عجمان",
  "أم القيوين",
  "رأس الخيمة",
  "الفجيرة",
] as const;

const EMIRATE_LOOKUP: Record<string, string> = {
  دبي: "دبي",
  dubai: "دبي",
  "ae-du": "دبي",
  أبوظبي: "أبوظبي",
  "أبو ظبي": "أبوظبي",
  "abu dhabi": "أبوظبي",
  "abu-dhabi": "أبوظبي",
  abudhabi: "أبوظبي",
  "ae-az": "أبوظبي",
  الشارقة: "الشارقة",
  sharjah: "الشارقة",
  "ae-sh": "الشارقة",
  عجمان: "عجمان",
  ajman: "عجمان",
  "ae-aj": "عجمان",
  "أم القيوين": "أم القيوين",
  "ام القيوين": "أم القيوين",
  "umm al quwain": "أم القيوين",
  "umm al-quwain": "أم القيوين",
  "umm-al-quwain": "أم القيوين",
  "ae-uq": "أم القيوين",
  "رأس الخيمة": "رأس الخيمة",
  "راس الخيمة": "رأس الخيمة",
  "ras al khaimah": "رأس الخيمة",
  "ras al-khaimah": "رأس الخيمة",
  "ras-al-khaimah": "رأس الخيمة",
  rak: "رأس الخيمة",
  "ae-rk": "رأس الخيمة",
  الفجيرة: "الفجيرة",
  fujairah: "الفجيرة",
  "ae-fu": "الفجيرة",
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_/|]+/g, " ")
    .replace(/\s+/g, " ");
}

/** Split "أبوظبي — مدينة خليفة" and "محمد بن زايد – أبوظبي". */
function splitLocationParts(value: string): string[] {
  return value
    .split(/\s*[—–\-|/,،]+\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function lookupEmirateToken(part: string): string | undefined {
  const trimmed = part.trim();
  if (!trimmed) return undefined;
  const direct = EMIRATE_LOOKUP[normalizeKey(trimmed)] ?? EMIRATE_LOOKUP[trimmed];
  if (direct) return direct;
  const withoutCity = trimmed.replace(/^مدينة\s+/, "").trim();
  if (withoutCity !== trimmed) {
    const nested =
      EMIRATE_LOOKUP[normalizeKey(withoutCity)] ?? EMIRATE_LOOKUP[withoutCity];
    if (nested) return nested;
  }
  return UAE_EMIRATE_NAMES.find((name) => trimmed === name);
}

/**
 * Resolve a free-text city/emirate label to a canonical Arabic emirate.
 * Handles English ids, typos, and both compound orders:
 * "أبوظبي — مدينة خليفة" and "محمد بن زايد – أبوظبي".
 */
export function canonicalizeEmirate(
  value: string | null | undefined,
): string | undefined {
  if (!value?.trim()) return undefined;
  const raw = value.trim();

  const direct = lookupEmirateToken(raw);
  if (direct) return direct;

  for (const part of splitLocationParts(raw)) {
    const fromPart = lookupEmirateToken(part);
    if (fromPart) return fromPart;
  }

  // Longest names first so "أم القيوين" wins over a shorter token.
  const byLength = [...UAE_EMIRATE_NAMES].sort((a, b) => b.length - a.length);
  for (const name of byLength) {
    if (
      raw === name ||
      raw.startsWith(`${name} `) ||
      raw.startsWith(`${name}—`) ||
      raw.startsWith(`${name}–`) ||
      raw.startsWith(`${name}-`) ||
      raw.endsWith(` ${name}`) ||
      raw.endsWith(`—${name}`) ||
      raw.endsWith(`–${name}`) ||
      raw.endsWith(`-${name}`) ||
      raw.includes(` ${name} `) ||
      raw.includes(`، ${name}`) ||
      raw.includes(`${name}،`)
    ) {
      return name;
    }
  }

  return undefined;
}

/** Extract area from compound city labels when `area` is missing. */
export function extractAreaLabel(
  value: string | null | undefined,
  emirate?: string,
): string | undefined {
  if (!value?.trim()) return undefined;
  const raw = value.trim();
  const resolvedEmirate = emirate || canonicalizeEmirate(raw);
  const parts = splitLocationParts(raw);

  if (parts.length >= 2) {
    const emirateIndex = parts.findIndex(
      (part) => lookupEmirateToken(part) === resolvedEmirate || Boolean(lookupEmirateToken(part)),
    );
    if (emirateIndex >= 0) {
      const area = parts.filter((_, index) => index !== emirateIndex).join(" — ");
      if (area && area !== resolvedEmirate) return area;
    }
    const firstIsEmirate = Boolean(lookupEmirateToken(parts[0]));
    const area = firstIsEmirate ? parts.slice(1).join(" — ") : parts[0];
    if (area && area !== resolvedEmirate) return area;
  }

  if (resolvedEmirate && lookupEmirateToken(raw) === resolvedEmirate) {
    return undefined;
  }
  if (emirate) {
    const known = areasForEmirate(emirate);
    if (known.includes(raw)) return raw;
  }
  for (const [emirateName, areas] of Object.entries(EMIRATE_AREAS)) {
    if (areas.includes(raw) && (!emirate || emirate === emirateName)) {
      return raw;
    }
  }
  return undefined;
}

export type ListingLocationRef = {
  city?: string;
  emirate?: string;
  area?: string;
};

/** When city/area is a known neighborhood, infer its emirate. */
export function inferEmirateFromArea(
  value: string | null | undefined,
): string | undefined {
  if (!value?.trim()) return undefined;
  const raw = value.trim();
  if (lookupEmirateToken(raw)) return undefined;
  const area = extractAreaLabel(raw) || raw;
  const matches: string[] = [];
  for (const [emirateName, areas] of Object.entries(EMIRATE_AREAS)) {
    if (areas.includes(area) || areas.includes(raw)) {
      matches.push(emirateName);
    }
  }
  return matches.length === 1 ? matches[0] : undefined;
}

/** Best-effort emirate for a listing row. */
export function listingEmirate(listing: ListingLocationRef): string | undefined {
  return (
    canonicalizeEmirate(listing.emirate) ||
    canonicalizeEmirate(listing.city) ||
    canonicalizeEmirate(listing.area) ||
    inferEmirateFromArea(listing.area) ||
    inferEmirateFromArea(listing.city) ||
    undefined
  );
}

function isEmirateName(value: string, emirate?: string): boolean {
  const canonical = canonicalizeEmirate(value);
  if (!canonical) return false;
  if (emirate) return canonical === emirate && lookupEmirateToken(value) === emirate;
  return lookupEmirateToken(value) === canonical;
}

/** Best-effort area for a listing row. */
export function listingArea(listing: ListingLocationRef): string | undefined {
  const emirate = listingEmirate(listing);
  const fromCity = extractAreaLabel(listing.city, emirate);
  if (listing.area?.trim()) {
    const area = listing.area.trim();
    if (area !== emirate && !isEmirateName(area, emirate)) {
      return extractAreaLabel(area, emirate) || area;
    }
  }
  return fromCity;
}

export function listingMatchesEmirateFilter(
  listing: ListingLocationRef,
  emirateFilter: string,
): boolean {
  if (!emirateFilter || emirateFilter === "all") return true;
  return listingEmirate(listing) === emirateFilter;
}

export function listingMatchesAreaFilter(
  listing: ListingLocationRef,
  areaFilter: string,
): boolean {
  if (!areaFilter || areaFilter === "all") return true;
  const area = listingArea(listing);
  if (area === areaFilter) return true;
  return listing.city?.trim() === areaFilter;
}
