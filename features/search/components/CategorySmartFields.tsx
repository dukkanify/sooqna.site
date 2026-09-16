"use client";

import { useEffect } from "react";
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
import type { SearchFilterState } from "./search-url";

type CategorySmartFieldsProps = {
  category?: Category;
  compact?: boolean;
  draft: SearchFilterState;
  onChange: (next: SearchFilterState) => void;
};

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
  return {
    ...draft,
    ranges: {
      ...draft.ranges,
      [key]: { ...draft.ranges?.[key], [bound]: value },
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
}: CategorySmartFieldsProps) {
  const categoryId = draft.category || category?.id || "";

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
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (!categoryId) {
    return (
      <p className="rounded-xl border border-dashed border-border/80 px-3 py-2 text-[0.7rem] leading-5 text-muted">
        اختر تصنيفاً لإظهار فلاتر الماركة والموديل والمواصفات.
      </p>
    );
  }

  const fields = getCategorySearchFields(categoryId);
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
      {subcategories.length > 0 ? (
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

      {emirate && areaOptions.length > 0 ? (
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
      )}

      {fields.map((field) => {
        if (!fieldVisibleForSpecs(field, specs)) return null;

        if (rangeField(field)) {
          const range = draft.ranges?.[field.key] ?? {};
          const yearOptions =
            field.key === "year"
              ? [{ label: "أي", value: "" }, ...optionsForSearchField(categoryId, field, specs)]
              : null;
          return (
            <div key={field.key} className="grid grid-cols-2 gap-2">
              {yearOptions ? (
                <>
                  <Select
                    compact={compact}
                    label={`من ${field.label}`}
                    name={`min_${field.key}`}
                    onChange={(event) =>
                      onChange(setRange(draft, field.key, "min", event.target.value))
                    }
                    options={yearOptions}
                    value={range.min ?? ""}
                  />
                  <Select
                    compact={compact}
                    label={`إلى ${field.label}`}
                    name={`max_${field.key}`}
                    onChange={(event) =>
                      onChange(setRange(draft, field.key, "max", event.target.value))
                    }
                    options={yearOptions}
                    value={range.max ?? ""}
                  />
                </>
              ) : (
                <>
                  <Input
                    compact={compact}
                    inputMode="numeric"
                    label={`أقل ${field.label}`}
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
                    label={`أعلى ${field.label}`}
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
          );
        }

        const options = optionsForSearchField(categoryId, field, specs);
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
              options={
                options.length > 0
                  ? options
                  : [{ label: "أخرى", value: "أخرى" }]
              }
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
