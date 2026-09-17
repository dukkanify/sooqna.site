"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CategoryFieldOption } from "@/types";
import {
  filterBrandOptions,
  filterModelOptions,
  isOtherOptionValue,
} from "@/shared/constants/product-brands";
import { Icon } from "@/shared/ui/Icon";
import { useTx } from "@/shared/i18n/useTx";

type BrandComboboxProps = {
  compact?: boolean;
  defaultValue?: string;
  error?: string;
  /** When true, show a loading panel instead of options (never flash «أخرى»). */
  loading?: boolean;
  label: string;
  name: string;
  onValueChange?: (value: string) => void;
  options: CategoryFieldOption[];
  /**
   * `model` keeps «أخرى / Other» pinned at the bottom through search/filter.
   * `brand` uses plain brand filtering.
   */
  optionKind?: "brand" | "model";
  placeholder?: string;
  required?: boolean;
};

export function BrandCombobox({
  compact = false,
  defaultValue = "",
  error,
  loading = false,
  label,
  name,
  onValueChange,
  options,
  optionKind = "brand",
  placeholder = "ابحث عن الماركة (مثال: Toy… أو App…)",
  required = false,
}: BrandComboboxProps) {
  const t = useTx();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filtered = useMemo(() => {
    if (loading) return [];
    return optionKind === "model"
      ? filterModelOptions(options, query)
      : filterBrandOptions(options, query);
  }, [loading, optionKind, options, query]);

  useEffect(() => {
    function resolveOptionFromQuery(raw: string): CategoryFieldOption | undefined {
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      return (
        options.find((option) => option.value === trimmed) ??
        options.find((option) => option.label === trimmed) ??
        options.find(
          (option) => option.label.toLowerCase() === trimmed.toLowerCase(),
        ) ??
        options.find(
          (option) => option.value.toLowerCase() === trimmed.toLowerCase(),
        )
      );
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
        const matched = resolveOptionFromQuery(query);
        if (matched) {
          if (matched.value !== value) {
            setQuery(matched.label);
            setValue(matched.value);
            onValueChange?.(matched.value);
          } else if (query.trim() !== matched.label) {
            setQuery(matched.label);
          }
          return;
        }
        // Keep typed custom brand if user entered something not in the list.
        if (query.trim() && query.trim() !== value) {
          setValue(query.trim());
          onValueChange?.(query.trim());
        }
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [onValueChange, options, query, value]);

  function resolveOptionFromQuery(raw: string): CategoryFieldOption | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    return (
      options.find((option) => option.value === trimmed) ??
      options.find((option) => option.label === trimmed) ??
      options.find(
        (option) => option.label.toLowerCase() === trimmed.toLowerCase(),
      ) ??
      options.find(
        (option) => option.value.toLowerCase() === trimmed.toLowerCase(),
      )
    );
  }

  function selectOption(option: CategoryFieldOption) {
    setQuery(option.label);
    setValue(option.value);
    onValueChange?.(option.value);
    setOpen(false);
    setActiveIndex(-1);
  }

  function commitCustom() {
    const matched = resolveOptionFromQuery(query);
    if (matched) {
      selectOption(matched);
      return;
    }
    const next = query.trim();
    if (next) {
      setValue(next);
      setQuery(next);
      onValueChange?.(next);
    }
    setOpen(false);
    setActiveIndex(-1);
  }

  const hasError = Boolean(error);
  const showList = open && !loading && filtered.length > 0;
  const showLoading = open && loading;
  const showEmptyCustom =
    open && !loading && Boolean(query.trim()) && filtered.length === 0;
  const countHintLabel =
    optionKind === "model"
      ? `${filtered.length} موديل — مرّر أو اكتب للبحث`
      : `${filtered.length} ماركة — مرّر أو اكتب للبحث`;

  return (
    <div ref={rootRef} className={`relative grid min-w-0 ${compact ? "gap-1" : "gap-1.5"}`}>
      <label className={`grid min-w-0 ${compact ? "gap-1" : "gap-1.5"}`}>
        <span
          className={
            compact
              ? "text-xs font-semibold text-muted"
              : "text-sm font-medium text-ink"
          }
        >
          {t(label)}
          {required ? <span className="text-error"> *</span> : null}
        </span>

        <div className="relative">
          <Icon
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
            name="search"
            size={compact ? 14 : 16}
          />
          <input
            aria-autocomplete="list"
            aria-busy={loading || undefined}
            aria-controls={listId}
            aria-expanded={showList || showLoading}
            aria-invalid={hasError || undefined}
            autoComplete="off"
            className={`focus-ring w-full min-w-0 rounded-[var(--radius-xl)] border bg-surface text-ink shadow-[var(--shadow-xs)] placeholder:text-muted/60 transition ${compact ? "min-h-9 rounded-lg pe-3 ps-8 text-xs font-medium" : "min-h-11 pe-4 ps-10 text-sm font-medium"} ${hasError ? "border-error bg-error-soft/30" : "border-border"}`}
            disabled={loading && optionKind === "model" && options.length === 0}
            onBlur={() => {
              // Delay so option click can register first.
              window.setTimeout(() => {
                if (!rootRef.current?.contains(document.activeElement)) {
                  commitCustom();
                }
              }, 120);
            }}
            onChange={(event) => {
              const next = event.target.value;
              setQuery(next);
              setOpen(true);
              setActiveIndex(-1);
              // Clear committed value until user picks or blurs.
              if (next.trim() !== value) {
                setValue("");
              }
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                setActiveIndex((index) =>
                  Math.min(index + 1, filtered.length - 1),
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                if (activeIndex >= 0 && filtered[activeIndex]) {
                  selectOption(filtered[activeIndex]);
                } else {
                  commitCustom();
                }
              } else if (event.key === "Escape") {
                setOpen(false);
                setActiveIndex(-1);
              }
            }}
            placeholder={t(placeholder)}
            role="combobox"
            type="text"
            value={query}
          />
          {/* Submitted value for FormData parsing (`spec_brand`). */}
          <input name={name} required={required} type="hidden" value={value || query.trim()} />
        </div>
      </label>

      {showLoading ? (
        <p
          className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-medium text-muted shadow-[0_12px_32px_rgb(15_20_25/14%)]"
          id={listId}
          role="status"
        >
          {t(
            optionKind === "model"
              ? "جاري تحميل الموديلات..."
              : "جاري التحميل...",
          )}
        </p>
      ) : null}

      {showList ? (
        <ul
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-border bg-surface py-1 shadow-[0_12px_32px_rgb(15_20_25/14%)]"
          id={listId}
          role="listbox"
        >
          {!query.trim() && filtered.length > 12 ? (
            <li className="sticky top-0 z-10 border-b border-border/70 bg-surface px-3 py-1.5 text-[0.7rem] font-bold text-muted">
              {t(countHintLabel)}
            </li>
          ) : null}
          {filtered.map((option, index) => {
            const active = index === activeIndex;
            const isOther = isOtherOptionValue(option.value);
            return (
              <li key={`${option.value}-${index}`} role="option" aria-selected={active}>
                <button
                  className={`flex w-full items-center px-3 py-2 text-start text-sm font-medium transition ${
                    isOther ? "border-t border-border/70" : ""
                  } ${active ? "bg-secondary-soft text-ink" : "text-ink hover:bg-surface-muted"}`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectOption(option);
                  }}
                  type="button"
                >
                  {t(option.label)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {showEmptyCustom ? (
        <p className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-muted shadow-[0_12px_32px_rgb(15_20_25/14%)]">
          {optionKind === "model"
            ? t("لا يوجد موديل مطابق — اختر «أخرى» أو اكتب اقتراحاً.")
            : t(`لا توجد ماركة مطابقة — سيتم حفظ «${query.trim()}» كما كتبتها.`)}
        </p>
      ) : null}

      {error ? (
        <span className="text-xs font-medium text-error" role="alert">
          {t(error)}
        </span>
      ) : null}
    </div>
  );
}
