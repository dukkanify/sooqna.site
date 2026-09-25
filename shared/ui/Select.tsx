"use client";

import type { SelectHTMLAttributes } from "react";
import { useTx } from "@/shared/i18n/useTx";

type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  compact?: boolean;
  error?: string;
  label: string;
  options: SelectOption[];
  /** When true, option labels are treated as user/admin content (skip LiveLocalizer). */
  optionsAreUgc?: boolean;
  /**
   * Empty first option so the seller must choose (no misleading default).
   * Shown when there is no controlled/default non-empty value.
   */
  placeholder?: string;
};

export function Select({
  className = "",
  compact = false,
  defaultValue,
  error,
  label,
  options,
  optionsAreUgc = false,
  placeholder,
  value,
  ...props
}: SelectProps) {
  const t = useTx();
  const hasError = Boolean(error);
  const translatedLabel = t(label);
  const translatedError = error ? t(error) : error;
  const resolvedValue = value !== undefined ? value : defaultValue;
  const showPlaceholder =
    Boolean(placeholder) &&
    (resolvedValue === undefined ||
      resolvedValue === null ||
      resolvedValue === "");

  return (
    <label className={`grid min-w-0 ${compact ? "gap-1" : "gap-1.5"}`}>
      <span
        className={
          compact ? "text-xs font-semibold text-muted" : "text-sm font-medium text-ink"
        }
      >
        {translatedLabel}
      </span>
      <select
        aria-invalid={hasError || undefined}
        className={`focus-ring w-full min-w-0 rounded-[var(--radius-xl)] border bg-surface text-ink shadow-[var(--shadow-xs)] transition ${compact ? "min-h-9 rounded-lg px-3 text-xs font-medium" : "min-h-11 px-4 text-sm font-medium"} ${hasError ? "border-error bg-error-soft/30" : "border-border"} ${className}`}
        data-ugc={optionsAreUgc ? "" : undefined}
        {...props}
        defaultValue={
          value === undefined
            ? showPlaceholder
              ? ""
              : defaultValue
            : undefined
        }
        value={value}
      >
        {showPlaceholder || placeholder ? (
          <option disabled={props.required} value="">
            {t(placeholder ?? "اختر...")}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {optionsAreUgc ? option.label : t(option.label)}
          </option>
        ))}
      </select>
      {translatedError ? (
        <span className="text-xs font-medium text-error" role="alert">
          {translatedError}
        </span>
      ) : null}
    </label>
  );
}
