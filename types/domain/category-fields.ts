export type CategoryFieldType =
  | "text"
  | "number"
  | "select"
  | "combobox"
  | "textarea"
  | "checkbox-group"
  | "date";

export type CategoryFieldOption = {
  label: string;
  value: string;
};

export type CategoryFieldShowWhenRule = {
  key: string;
  values: string[];
};

/**
 * Show field when the rule matches. A single rule or an AND-list of rules.
 * Example: broker + Dubai → BRN.
 */
export type CategoryFieldShowWhen =
  | CategoryFieldShowWhenRule
  | CategoryFieldShowWhenRule[];

export type CategoryFieldDefinition = {
  key: string;
  label: string;
  type: CategoryFieldType;
  required?: boolean;
  placeholder?: string;
  options?: CategoryFieldOption[];
  /** Helper note shown under the field */
  note?: string;
  /**
   * Optional section heading rendered above this field in the add-listing form
   * (e.g. «تفاصيل المبنى»).
   */
  section?: string;
  /** Included in auto-generated listing title */
  titlePart?: boolean;
  /** Searchable in query matching */
  searchable?: boolean;
  /** Show field only when another spec matches one of the values */
  showWhen?: CategoryFieldShowWhen;
  /** Optional RegExp source tested against non-empty values */
  pattern?: string;
  /** Arabic message when pattern fails */
  patternMessage?: string;
};

export type CategorySpecValue = string | number | boolean;

export type CategorySpecs = Record<string, CategorySpecValue>;
