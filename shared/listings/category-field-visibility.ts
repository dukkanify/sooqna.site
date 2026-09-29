type ShowWhenRule = { key: string; values: string[] };

type ShowWhen = ShowWhenRule | ShowWhenRule[];

type FieldLike = {
  showWhen?: ShowWhen;
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

/** True when every showWhen rule matches current spec values (AND). */
export function fieldVisibleForSpecs(
  field: FieldLike,
  specs: Record<string, string>,
): boolean {
  const rules = normalizeShowWhenRules(field.showWhen);
  if (rules.length === 0) return true;
  return rules.every((rule) => rule.values.includes(specs[rule.key] ?? ""));
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
