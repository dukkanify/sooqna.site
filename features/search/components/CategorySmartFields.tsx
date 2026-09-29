"use client";

import { useEffect, useState } from "react";
import type { Category, CategoryFieldDefinition } from "@/types";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { BrandCombobox } from "@/shared/ui/BrandCombobox";
import { areasForEmirate } from "@/shared/constants/emirate-areas";
import {
  cascadeChildKey,
  fieldVisibleForSpecs,
  getCategorySearchFields,
  isSearchRangeKey,
  optionsForSearchField,
  subcategoryFilterLabel,
} from "@/features/search/lib/category-filter-fields";
import { setVehicleCatalogOverrides } from "@/shared/vehicles";
import { fetchPopularityScores } from "@/features/search/lib/record-search-popularity";
import {
  YEAR_RANGE_ERROR_AR,
  isYearRangeInverted,
  parseYearBound,
} from "@/features/search/lib/year-range";
import type { SearchFilterState } from "./search-url";

/** Cars search: keep make/model/year up front; tuck the rest under «المزيد». */
const CARS_ESSENTIAL_KEYS = new Set(["brand", "model", "year"]);
const CARS_ADVANCED_KEYS = new Set([
  "mileage",
  "condition",
  "regionalSpecs",
  "bodyType",
  "transmission",
  "fuelType",
  "drivetrain",
]);

export type SmartFieldsVariant = "full" | "essential" | "advanced";

type CategorySmartFieldsProps = {
  category?: Category;
  compact?: boolean;
  draft: SearchFilterState;
  onChange: (next: SearchFilterState) => void;
  /** Mobile sheet can show essentials or advanced-only; default is everything. */
  variant?: SmartFieldsVariant;
};

function rangeLabels(field: CategoryFieldDefinition): { min: string; max: string } {
  if (field.key === "year") return { min: "من سنة", max: "إلى سنة" };
  if (field.key === "mileage") return { min: "من كم", max: "إلى كم" };
  return { min: `من ${field.label}`, max: `إلى ${field.label}` };
}

function setSpec(
  draft: SearchFilterState,
  key: string,
  value: string,
  categoryId: string,
): SearchFilterState {
  const specs = { ...draft.specs, [key]: value };
  const child = cascadeChildKey(key);
  if (child) {
    const childValue = specs[child] ?? "";
    const allowed = optionsForSearchField(
      categoryId,
      { key: child, label: child, type: "combobox" },
      specs,
    ).some((option) => option.value === childValue);
    if (!allowed) specs[child] = "";
  }
  const ranges = { ...draft.ranges };
  for (const field of getCategorySearchFields(categoryId)) {
    if (!fieldVisibleForSpecs(field, specs)) {
      specs[field.key] = "";
      delete ranges[field.key];
    }
  }
  return { ...draft, specs, ranges };
}

function setRange(
  draft: SearchFilterState,
  key: string,
  bound: "min" | "max",
  value: string,
): SearchFilterState {
  const current = { ...draft.ranges?.[key], [bound]: value };
  // Year: if the new bound makes the range inverted, clear the opposite bound.
  if (key === "year") {
    const min = parseYearBound(current.min);
    const max = parseYearBound(current.max);
    if (min !== undefined && max !== undefined && min > max) {
      if (bound === "min") current.max = "";
      else current.min = "";
    }
  }
  return {
    ...draft,
    ranges: {
      ...draft.ranges,
      [key]: current,
    },
  };
}

function rangeField(field: CategoryFieldDefinition): boolean {
  return isSearchRangeKey(field.key) && (field.type === "number" || field.key === "year" || field.key === "mileage");
}

export function CategorySmartFields({
  category,
  compact = true,
  draft,
  onChange,
  variant = "full",
}: CategorySmartFieldsProps) {
  const categoryId = draft.category || category?.id || "";
  const isCars = categoryId === "cars";
  const showMeta = variant === "full" || variant === "advanced";
  const showEmptyHint = variant !== "advanced";
  const [popularityScores, setPopularityScores] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;
    void fetchPopularityScores().then((scores) => {
      if (!cancelled) setPopularityScores(scores);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (categoryId !== "cars") return;
    let cancelled = false;
    void fetch("/api/vehicle-catalog/overrides")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setVehicleCatalogOverrides({
          disabledMakeSlugs: data.disabledMakeSlugs ?? [],
          disabledModelIds: data.disabledModelIds ?? [],
          addedModels: data.addedModels ?? [],
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (!categoryId) {
    if (!showEmptyHint) return null;
    return (
      <p className="rounded-xl border border-dashed border-border/80 px-3 py-2 text-[0.7rem] leading-5 text-muted">
        اختر تصنيفاً لإظهار فلاتر الماركة والموديل والمواصفات.
      </p>
    );
  }

  const fields = getCategorySearchFields(categoryId).filter((field) => {
    if (!isCars || variant === "full") return true;
    if (variant === "essential") return CARS_ESSENTIAL_KEYS.has(field.key);
    return CARS_ADVANCED_KEYS.has(field.key);
  });
  const specs = draft.specs ?? {};
  const subcategories = category?.subcategories ?? [];
  const emirate = draft.city ?? "";
  const areaOptions = areasForEmirate(emirate);
  const areaValue = draft.area ?? "";
  const areaSelectOptions = [
    { label: "كل المناطق", value: "" },
    ...areaOptions.map((area) => ({ label: area, value: area })),
    ...(areaValue && !areaOptions.includes(areaValue)
      ? [{ label: areaValue, value: areaValue }]
      : []),
  ];

  return (
    <div className="grid gap-2">
      {showMeta && subcategories.length > 0 ? (
        <Select
          compact={compact}
          label={subcategoryFilterLabel(categoryId)}
          name="subcategory"
          onChange={(event) =>
            onChange({
              ...draft,
              subcategory: event.target.value,
              specs:
                categoryId === "services"
                  ? { ...specs, serviceCategory: "" }
                  : specs,
            })
          }
          options={[
            { label: "الكل", value: "" },
            ...subcategories.map((item) => ({ label: item, value: item })),
          ]}
          value={draft.subcategory ?? ""}
        />
      ) : null}

      {showMeta ? (
        emirate && areaOptions.length > 0 ? (
          <Select
            compact={compact}
            label="المنطقة"
            name="area"
            onChange={(event) => onChange({ ...draft, area: event.target.value })}
            options={areaSelectOptions}
            value={areaValue}
          />
        ) : (
          <Input
            compact={compact}
            label="المنطقة"
            name="area"
            onChange={(event) => onChange({ ...draft, area: event.target.value })}
            placeholder="مثال: جميرا، مردف"
            value={areaValue}
          />
        )
      ) : null}

      {fields.map((field) => {
        if (!fieldVisibleForSpecs(field, specs)) return null;

        if (rangeField(field)) {
          const range = draft.ranges?.[field.key] ?? {};
          const labels = rangeLabels(field);
          const yearOptions =
            field.key === "year"
              ? [
                  { label: "أي", value: "" },
                  ...optionsForSearchField(
                    categoryId,
                    field,
                    specs,
                    popularityScores,
                  ),
                ]
              : null;
          const yearMinNum = parseYearBound(range.min);
          const yearMaxNum = parseYearBound(range.max);
          const yearMinOptions = yearOptions
            ? yearOptions.filter((option) => {
                if (!option.value) return true;
                if (yearMaxNum === undefined) return true;
                return Number(option.value) <= yearMaxNum;
              })
            : null;
          const yearMaxOptions = yearOptions
            ? yearOptions.filter((option) => {
                if (!option.value) return true;
                if (yearMinNum === undefined) return true;
                return Number(option.value) >= yearMinNum;
              })
            : null;
          const yearInverted =
            field.key === "year" &&
            isYearRangeInverted(range.min, range.max);
          return (
            <div key={field.key} className="grid gap-1.5">
              <div className="grid grid-cols-2 gap-2">
              {yearOptions && yearMinOptions && yearMaxOptions ? (
                <>
                  <Select
                    compact={compact}
                    label={labels.min}
                    name={`min_${field.key}`}
                    onChange={(event) =>
                      onChange(setRange(draft, field.key, "min", event.target.value))
                    }
                    options={yearMinOptions}
                    value={range.min ?? ""}
                  />
                  <Select
                    compact={compact}
                    label={labels.max}
                    name={`max_${field.key}`}
                    onChange={(event) =>
                      onChange(setRange(draft, field.key, "max", event.target.value))
                    }
                    options={yearMaxOptions}
                    value={range.max ?? ""}
                  />
                </>
              ) : (
                <>
                  <Input
                    compact={compact}
                    inputMode="numeric"
                    label={labels.min}
                    min="0"
                    name={`min_${field.key}`}
                    onChange={(event) =>
                      onChange(setRange(draft, field.key, "min", event.target.value))
                    }
                    type="number"
                    value={range.min ?? ""}
                  />
                  <Input
                    compact={compact}
                    inputMode="numeric"
                    label={labels.max}
                    min="0"
                    name={`max_${field.key}`}
                    onChange={(event) =>
                      onChange(setRange(draft, field.key, "max", event.target.value))
                    }
                    type="number"
                    value={range.max ?? ""}
                  />
                </>
              )}
              </div>
              {yearInverted ? (
                <p className="text-xs font-medium text-error" role="alert">
                  {YEAR_RANGE_ERROR_AR}
                </p>
              ) : null}
            </div>
          );
        }

        const options = optionsForSearchField(
          categoryId,
          field,
          specs,
          popularityScores,
        );
        const value = specs[field.key] ?? "";
        const name = `spec_${field.key}`;
        const modelLocked = field.key === "model" && !specs.brand;

        if (field.type === "combobox") {
          return (
            <BrandCombobox
              key={`${field.key}-${specs.brand ?? ""}`}
              compact={compact}
              defaultValue={value}
              label={field.label}
              name={name}
              onValueChange={(next) => onChange(setSpec(draft, field.key, next, categoryId))}
              optionKind={field.key === "model" ? "model" : "brand"}
              options={options}
              placeholder={
                modelLocked ? "اختر الماركة أولاً" : field.placeholder
              }
            />
          );
        }

        if (field.type === "select" || options.length > 0) {
          return (
            <Select
              key={field.key}
              compact={compact}
              disabled={modelLocked}
              label={field.label}
              name={name}
              onChange={(event) =>
                onChange(setSpec(draft, field.key, event.target.value, categoryId))
              }
              options={[{ label: "الكل", value: "" }, ...options]}
              value={value}
            />
          );
        }

        return (
          <Input
            key={field.key}
            compact={compact}
            label={field.label}
            name={name}
            onChange={(event) =>
              onChange(setSpec(draft, field.key, event.target.value, categoryId))
            }
            placeholder={field.placeholder}
            value={value}
          />
        );
      })}
    </div>
  );
}
