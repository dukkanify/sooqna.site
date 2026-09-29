/** Car model year from–to validation helpers. */

export function parseYearBound(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

/** True when both years are set and from > to. */
export function isYearRangeInverted(
  minYear: string | undefined,
  maxYear: string | undefined,
): boolean {
  const min = parseYearBound(minYear);
  const max = parseYearBound(maxYear);
  if (min === undefined || max === undefined) return false;
  return min > max;
}

export const YEAR_RANGE_ERROR_AR =
  "سنة البداية يجب أن تكون أقل من أو تساوي سنة النهاية";
