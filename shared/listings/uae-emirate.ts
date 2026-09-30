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

/**
 * Resolve a free-text city/emirate label to a canonical Arabic emirate.
 * Handles English ids, typos, and compounds like "أبوظبي — مدينة خليفة".
 */
export function canonicalizeEmirate(
  value: string | null | undefined,
): string | undefined {
  if (!value?.trim()) return undefined;
  const raw = value.trim();

  const direct = EMIRATE_LOOKUP[normalizeKey(raw)] ?? EMIRATE_LOOKUP[raw];
  if (direct) return direct;

  const compound = raw.split(/\s*[—–\-|]\s*/)[0]?.trim();
  if (compound && compound !== raw) {
    const fromCompound =
      EMIRATE_LOOKUP[normalizeKey(compound)] ?? EMIRATE_LOOKUP[compound];
    if (fromCompound) return fromCompound;
  }

  for (const name of UAE_EMIRATE_NAMES) {
    if (
      raw === name ||
      raw.startsWith(`${name} `) ||
      raw.startsWith(`${name}—`) ||
      raw.startsWith(`${name}-`)
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
  const parts = raw
    .split(/\s*[—–\-|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const area = parts.slice(1).join(" — ");
    if (area && area !== emirate) return area;
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

/** Best-effort emirate for a listing row. */
export function listingEmirate(listing: ListingLocationRef): string | undefined {
  return (
    canonicalizeEmirate(listing.emirate) ||
    canonicalizeEmirate(listing.city) ||
    undefined
  );
}

/** Best-effort area for a listing row. */
export function listingArea(listing: ListingLocationRef): string | undefined {
  const emirate = listingEmirate(listing);
  if (listing.area?.trim()) {
    const area = listing.area.trim();
    if (area !== emirate) return area;
  }
  return extractAreaLabel(listing.city, emirate);
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
