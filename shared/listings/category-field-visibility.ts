type ShowWhenRule = { key: string; values: string[] };

type ShowWhen = ShowWhenRule | ShowWhenRule[];

type FieldLike = {
  key?: string;
  showWhen?: ShowWhen;
  hideWhen?: ShowWhen;
  pattern?: string;
  patternMessage?: string;
  label?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
};

const OTHER_OPTION_AR = "أخرى";

/** True for «أخرى» / `other` (admin snapshots mix both). */
export function isOtherOptionValue(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  return trimmed === OTHER_OPTION_AR || trimmed.toLowerCase() === "other";
}

/** Companion «حدد النوع (أخرى)» / `*Other` text field. */
export function isOtherDetailField(field: FieldLike): boolean {
  const key = field.key ?? "";
  if (/Other$/i.test(key) && key.length > "Other".length) return true;
  const label = field.label ?? "";
  return /\(أخرى\)/.test(label) || /حدد النوع/.test(label);
}

/** Parent select for an Other-detail field (`furnitureTypeOther` → `furnitureType`). */
export function parentKeyForOtherField(field: FieldLike): string | undefined {
  const rules = normalizeShowWhenRules(field.showWhen);
  if (rules.length === 1 && rules[0]?.key) return rules[0].key;
  const key = field.key ?? "";
  if (/Other$/i.test(key) && key.length > "Other".length) {
    return key.replace(/Other$/i, "");
  }
  return undefined;
}

function specMatchesValue(actual: string, expected: string): boolean {
  if (actual === expected) return true;
  return isOtherOptionValue(actual) && isOtherOptionValue(expected);
}

/** Normalize single or AND-list showWhen rules. */
export function normalizeShowWhenRules(
  showWhen: ShowWhen | undefined,
): ShowWhenRule[] {
  if (!showWhen) return [];
  return Array.isArray(showWhen) ? showWhen : [showWhen];
}

function ruleMatches(rule: ShowWhenRule, specs: Record<string, string>): boolean {
  const actual = specs[rule.key] ?? "";
  return rule.values.some((value) => specMatchesValue(actual, value));
}

function siblingTypeParentKey(fields: FieldLike[], otherKey: string | undefined) {
  const hit = fields.find((field) => {
    if (!field.key || field.key === otherKey) return false;
    return (field.options ?? []).some(
      (option) =>
        isOtherOptionValue(option.value) || isOtherOptionValue(option.label),
    );
  });
  return hit?.key;
}

/**
 * Restore showWhen on Other-detail fields when admin snapshots dropped it.
 * Parent is the `*Other` prefix, an existing showWhen key, or a sibling select
 * that includes «أخرى».
 */
export function withImplicitOtherShowWhen<T extends FieldLike>(fields: T[]): T[] {
  const keys = new Set(
    fields.map((field) => field.key).filter((key): key is string => Boolean(key)),
  );
  return fields.map((field) => {
    if (!isOtherDetailField(field)) return field;
    const inferred =
      parentKeyForOtherField(field) ||
      siblingTypeParentKey(fields, field.key);
    if (!inferred || !keys.has(inferred)) return field;
    const existing = normalizeShowWhenRules(field.showWhen);
    if (existing.length > 0) {
      const nextRules = existing.map((rule) => {
        if (!rule.values.some((value) => isOtherOptionValue(value))) return rule;
        const values = [...rule.values];
        if (!values.some((value) => value.toLowerCase() === "other")) {
          values.push("other");
        }
        if (!values.includes(OTHER_OPTION_AR)) values.push(OTHER_OPTION_AR);
        return { ...rule, values };
      });
      return {
        ...field,
        showWhen: nextRules.length === 1 ? nextRules[0] : nextRules,
      };
    }
    return {
      ...field,
      showWhen: { key: inferred, values: ["other", OTHER_OPTION_AR] },
    };
  });
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
  if (rules.length > 0) {
    return rules.every((rule) => ruleMatches(rule, specs));
  }
  if (isOtherDetailField(field)) {
    const parent = parentKeyForOtherField(field);
    if (parent) return isOtherOptionValue(specs[parent]);
  }
  return true;
}

/** Required only when the field is visible (Other text never required for a real type). */
export function fieldRequiredForSpecs(
  field: FieldLike,
  specs: Record<string, string>,
): boolean {
  if (!field.required) return false;
  return fieldVisibleForSpecs(field, specs);
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
