/**
 * Search / filter popularity ranking.
 * Seeds give a sensible UAE-marketplace default order; live counts
 * from `/api/search/popularity` override as usage accumulates.
 */

export type PopularityKind = "pill" | "query" | "category" | "city" | "brand" | "spec";

/** Stable hero-pill keys shared across AR/EN labels. */
export const HERO_PILL_KEYS = [
  "land-cruiser",
  "patrol",
  "mercedes",
  "apartment",
  "villa",
  "iphone",
  "macbook",
  "yas-island",
  "abu-dhabi-corniche",
  "office",
] as const;

export type HeroPillKey = (typeof HERO_PILL_KEYS)[number];

/** Baseline weights so first paint already reflects likely demand. */
export const POPULARITY_SEEDS: Record<string, number> = {
  "pill:land-cruiser": 120,
  "pill:patrol": 115,
  "pill:mercedes": 110,
  "pill:apartment": 100,
  "pill:villa": 95,
  "pill:iphone": 90,
  "pill:macbook": 70,
  "pill:yas-island": 55,
  "pill:abu-dhabi-corniche": 50,
  "pill:office": 45,

  "category:cars": 200,
  "category:real-estate": 160,
  "category:mobiles": 130,
  "category:electronics": 90,
  "category:furniture": 70,
  "category:jobs": 65,
  "category:services": 60,
  "category:food": 40,

  "brand:toyota": 140,
  "brand:nissan": 130,
  "brand:mercedes": 125,
  "brand:mercedes-benz": 125,
  "brand:bmw": 110,
  "brand:lexus": 105,
  "brand:land-rover": 95,
  "brand:apple": 120,
  "brand:samsung": 100,
};

const PILL_ALIASES: Record<string, HeroPillKey> = {
  mercedes: "mercedes",
  "mercedes-benz": "mercedes",
  مرسيدس: "mercedes",
  patrol: "patrol",
  باترول: "patrol",
  "yas island": "yas-island",
  "جزيرة ياس": "yas-island",
  "abu dhabi corniche": "abu-dhabi-corniche",
  "كورنيش أبوظبي": "abu-dhabi-corniche",
  "كورنيش ابوظبي": "abu-dhabi-corniche",
  apartment: "apartment",
  شقة: "apartment",
  villa: "villa",
  فيلا: "villa",
  iphone: "iphone",
  آيفون: "iphone",
  ايفون: "iphone",
  office: "office",
  مكتب: "office",
  macbook: "macbook",
  "ماك بوك": "macbook",
  "land cruiser": "land-cruiser",
  "لاند كروزر": "land-cruiser",
};

export function popularityId(kind: PopularityKind, key: string): string {
  return `${kind}:${normalizePopularityKey(key)}`;
}

export function normalizePopularityKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

export function resolveHeroPillKey(labelOrQuery: string): HeroPillKey | null {
  const normalized = normalizePopularityKey(labelOrQuery).replace(/-/g, " ");
  if (PILL_ALIASES[normalized]) return PILL_ALIASES[normalized];
  const compact = normalized.replace(/\s/g, "");
  for (const [alias, key] of Object.entries(PILL_ALIASES)) {
    if (alias.replace(/\s/g, "") === compact) return key;
  }
  return null;
}

export function mergePopularityScores(
  live: Record<string, number> = {},
): Record<string, number> {
  return { ...POPULARITY_SEEDS, ...live };
}

export function scoreFor(
  scores: Record<string, number>,
  kind: PopularityKind,
  key: string,
): number {
  return scores[popularityId(kind, key)] ?? 0;
}

/** Stable sort: higher score first, preserve relative order on ties. */
export function sortByPopularity<T>(
  items: readonly T[],
  getKey: (item: T) => string,
  scores: Record<string, number>,
  kind: PopularityKind,
): T[] {
  return items
    .map((item, index) => ({
      item,
      index,
      score: scoreFor(scores, kind, getKey(item)),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}
