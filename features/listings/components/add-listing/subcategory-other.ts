/** Add-listing subcategory «أخرى» escape hatch (no path-alias imports — used by node:test). */

export const OTHER_OPTION_VALUE = "أخرى";

export function isOtherOptionValue(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  return trimmed === OTHER_OPTION_VALUE || trimmed.toLowerCase() === "other";
}

/** Canonical subcategory options plus a trailing «أخرى» escape hatch. */
export function subcategoryOptionsWithOther(
  subcategories: string[] | undefined | null,
): Array<{ label: string; value: string }> {
  const seen = new Set<string>();
  const options: Array<{ label: string; value: string }> = [];
  for (const raw of subcategories ?? []) {
    const value = String(raw ?? "").trim();
    if (!value || seen.has(value) || isOtherOptionValue(value)) continue;
    seen.add(value);
    options.push({ label: value, value });
  }
  options.push({ label: OTHER_OPTION_VALUE, value: OTHER_OPTION_VALUE });
  return options;
}

/**
 * Resolve the value stored on the listing:
 * - «أخرى» + free text → free text (≥2 chars)
 * - empty/short Other text → undefined (invalid; caller should validate)
 * - normal pick → as-is
 */
export function resolveListingSubcategory(
  selected: string | undefined,
  otherText: string | undefined,
): string | undefined {
  const pick = selected?.trim() ?? "";
  if (!pick) return undefined;
  if (isOtherOptionValue(pick)) {
    const custom = otherText?.trim() ?? "";
    return custom.length >= 2 ? custom : undefined;
  }
  return pick;
}

export const SUBCATEGORY_OTHER_ERROR_AR =
  "اكتب وصفاً قصيراً للقسم الفرعي عند اختيار «أخرى».";
