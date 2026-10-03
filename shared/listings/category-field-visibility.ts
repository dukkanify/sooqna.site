type ShowWhenRule = { key: string; values: string[] };

type ShowWhen = ShowWhenRule | ShowWhenRule[];

type FieldLike = {
  key?: string;
  showWhen?: ShowWhen;
  hideWhen?: ShowWhen;
  pattern?: string;
  patternMessage?: string;
  label?: string;
};

/** Normalize single or AND-list showWhen rules. */
export function normalizeShowWhenRules(
  showWhen: ShowWhen | undefined,
): ShowWhenRule[] {
  if (!showWhen) return [];
  return Array.isArray(showWhen) ? showWhen : [showWhen];
}

function ruleMatches(rule: ShowWhenRule, specs: Record<string, string>): boolean {
  return rule.values.includes(specs[rule.key] ?? "");
}

/** True when every showWhen rule matches current spec values (AND). */
export function fieldVisibleForSpecs(
  field: FieldLike,
  specs: Record<string, string>,
): boolean {
  const hideRules = normalizeShowWhenRules(field.hideWhen);
  if (hideRules.some((rule) => ruleMatches(rule, specs))) {
    return false;
  }
  const rules = normalizeShowWhenRules(field.showWhen);
  if (rules.length === 0) return true;
  return rules.every((rule) => ruleMatches(rule, specs));
}

/** Fold subcategory (and similar) into the spec map used for show/hide. */
export function withVisibilityContext(
  specs: Record<string, string>,
  extra?: { subcategory?: string },
): Record<string, string> {
  const subcategory = extra?.subcategory?.trim();
  if (!subcategory) return specs;
  return { ...specs, subcategory };
}

export function specsRecordFromCategorySpecs(
  specs: Record<string, string | number | boolean> | undefined,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(specs ?? {})) {
    if (value === undefined || value === null || typeof value === "boolean") {
      continue;
    }
    next[key] = String(value).trim();
  }
  return next;
}

/** Validate optional pattern on a filled field value. Returns error message or null. */
export function matchesFieldPattern(
  field: FieldLike,
  value: string,
): string | null {
  const pattern = field.pattern?.trim();
  if (!pattern) return null;
  try {
    const re = new RegExp(pattern);
    if (re.test(value)) return null;
  } catch {
    return null;
  }
  return (
    field.patternMessage?.trim() ||
    `${field.label ?? "الحقل"} بصيغة غير صحيحة.`
  );
}
