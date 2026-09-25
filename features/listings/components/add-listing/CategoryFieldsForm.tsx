"use client";

import { useEffect, useMemo, useState } from "react";
import type { CategoryFieldDefinition, CategorySpecs, Listing, ListingCondition } from "@/types";
import { getCategoryFields, isDynamicCategory } from "@/shared/constants/category-fields";
import { getModelsForBrand } from "@/shared/constants/product-brand-models";
import { getBrandOptionsForCategory } from "@/shared/constants/product-brands";
import { BrandCombobox } from "@/shared/ui/BrandCombobox";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import type { CategoryFieldOption } from "@/types";
import {
  addListingCheckboxGridClass,
  addListingCheckboxGroupClass,
  addListingCheckboxLabelClass,
  addListingDynamicFieldsGridClass,
  addListingStepCardClass,
  addListingStepDescClass,
  addListingStepFooterClass,
  addListingStepTitleClass,
} from "./utils";

export type CategoryFieldErrors = Record<string, string | undefined>;

export type CategoryFieldsDefaults = {
  categorySpecs?: CategorySpecs;
  condition?: ListingCondition;
  contactPhone?: string;
  description?: string;
  features?: string[];
  negotiable?: boolean;
  price?: number;
};

type CategoryFieldsFormProps = {
  categoryId: string;
  defaults?: CategoryFieldsDefaults;
  errors: CategoryFieldErrors;
  heading?: string;
  listing?: Listing;
  onPreviewChange?: (patch: {
    city?: string;
    condition?: ListingCondition;
    description?: string;
    hideCondition?: boolean;
    price?: string;
    priceMode?: "aed" | "salary";
    title?: string;
  }) => void;
  showContact?: boolean;
  stepLabel?: string;
};

function getSpecValue(
  defaults: CategoryFieldsDefaults | undefined,
  key: string,
): string | number | undefined {
  const value = defaults?.categorySpecs?.[key];
  if (value === undefined || value === null || typeof value === "boolean") {
    return undefined;
  }
  return value;
}

function fieldVisible(
  field: CategoryFieldDefinition,
  specs: Record<string, string>,
): boolean {
  if (!field.showWhen) return true;
  const current = specs[field.showWhen.key] ?? "";
  return field.showWhen.values.includes(current);
}

function renderField(
  field: CategoryFieldDefinition,
  defaults: CategoryFieldsDefaults | undefined,
  selectedFeatures: string[],
  onSpecChange: (key: string, value: string) => void,
  optionsOverride?: CategoryFieldOption[],
  remountKey?: string,
  currentValue?: string,
  comboboxLoading = false,
) {
  const name = `spec_${field.key}`;
  const defaultValue =
    currentValue !== undefined
      ? currentValue
      : getSpecValue(defaults, field.key);
  const options = optionsOverride ?? field.options ?? [];

  if (field.type === "textarea") {
    return (
      <Textarea
        key={field.key}
        compact
        defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
        label={field.label}
        name={name}
        onChange={(event) => onSpecChange(field.key, event.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  }

  if (field.type === "select") {
    const needsChoice =
      field.key === "condition" ||
      field.key === "warranty" ||
      field.key === "listingType" ||
      field.key === "employmentType" ||
      field.key === "availability";
    return (
      <Select
        key={field.key}
        compact
        defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
        label={field.label}
        name={name}
        onChange={(event) => onSpecChange(field.key, event.target.value)}
        options={options}
        placeholder={needsChoice ? "اختر..." : undefined}
        required={field.required}
      />
    );
  }

  if (field.type === "combobox") {
    const modelNeedsBrand =
      field.key === "model" && options.length === 0 && !comboboxLoading;
    return (
      <BrandCombobox
        key={remountKey ?? field.key}
        compact
        defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
        label={field.label}
        loading={comboboxLoading}
        name={name}
        onValueChange={(value) => onSpecChange(field.key, value)}
        optionKind={field.key === "model" ? "model" : "brand"}
        options={options}
        placeholder={
          modelNeedsBrand ? "اختر الماركة أولاً" : field.placeholder
        }
        required={field.required}
      />
    );
  }

  if (field.type === "checkbox-group") {
    return (
      <fieldset key={field.key} className={addListingCheckboxGroupClass}>
        <legend className="mb-1 px-0.5 text-xs font-semibold text-ink">
          <LocalizedTree>{field.label}</LocalizedTree>
        </legend>
        <div className={addListingCheckboxGridClass}>
          {(field.options ?? []).map((option) => (
            <label key={option.value} className={addListingCheckboxLabelClass}>
              <input
                className="size-3.5 shrink-0 accent-primary sm:size-4"
                defaultChecked={selectedFeatures.includes(option.value)}
                name={name}
                type="checkbox"
                value={option.value}
              />
              <span className="min-w-0 truncate">
                <LocalizedTree>{option.label}</LocalizedTree>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  const inputType =
    field.type === "number" ? "number" : field.type === "date" ? "date" : "text";

  return (
    <Input
      key={field.key}
      compact
      defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
      inputMode={field.type === "number" ? "numeric" : undefined}
      label={field.label}
      min={field.type === "number" ? "0" : undefined}
      name={name}
      onChange={(event) => onSpecChange(field.key, event.target.value)}
      placeholder={field.placeholder}
      required={field.required}
      type={inputType}
    />
  );
}

function buildSelectedFeatures(defaults?: CategoryFieldsDefaults): string[] {
  const features = [...(defaults?.features ?? [])];
  if (defaults?.negotiable && !features.includes("قابل للتفاوض")) {
    features.push("قابل للتفاوض");
  }
  return features;
}

export function CategoryFieldsForm({
  categoryId,
  defaults,
  errors,
  heading = "تفاصيل الإعلان",
  onPreviewChange,
  showContact = false,
  stepLabel,
}: CategoryFieldsFormProps) {
  const isJobs = categoryId === "jobs";
  const isFood = categoryId === "food";
  const hideCondition = isJobs || isFood;
  const fallbackFields = useMemo(
    () => (isDynamicCategory(categoryId) ? getCategoryFields(categoryId) : []),
    [categoryId],
  );
  const [remoteFields, setRemoteFields] = useState<{
    categoryId: string;
    fields: CategoryFieldDefinition[];
  } | null>(null);
  /** Bumps after catalog overrides apply so model options re-render once (no Other flash). */
  const [catalogEpoch, setCatalogEpoch] = useState(0);
  const catalogLoading = categoryId === "cars" && catalogEpoch === 0;

  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    void fetch(`/api/category-fields?categoryId=${encodeURIComponent(categoryId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.fields) && data.fields.length > 0) {
          setRemoteFields({
            categoryId,
            fields: data.fields as CategoryFieldDefinition[],
          });
        } else if (!isDynamicCategory(categoryId)) {
          setRemoteFields({ categoryId, fields: [] });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  useEffect(() => {
    if (categoryId !== "cars") return;
    let cancelled = false;
    void fetch("/api/vehicle-catalog/overrides")
      .then((response) => (response.ok ? response.json() : null))
      .then(async (data) => {
        if (cancelled) return;
        if (data) {
          const { setVehicleCatalogOverrides } = await import("@/shared/vehicles");
          if (cancelled) return;
          setVehicleCatalogOverrides({
            disabledMakeSlugs: data.disabledMakeSlugs ?? [],
            disabledModelIds: data.disabledModelIds ?? [],
            addedModels: data.addedModels ?? [],
          });
        }
        if (cancelled) return;
        setCatalogEpoch((epoch) => epoch + 1);
      })
      .catch(() => {
        if (cancelled) return;
        setCatalogEpoch((epoch) => epoch + 1);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const allFields =
    remoteFields?.categoryId === categoryId
      ? remoteFields.fields
      : fallbackFields;

  const [specs, setSpecs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fallbackFields) {
      const value = getSpecValue(defaults, field.key);
      if (value !== undefined) initial[field.key] = String(value);
    }
    return initial;
  });

  const fields = allFields.filter(
    (field) => field.type !== "checkbox-group" && fieldVisible(field, specs),
  );
  const featureField = allFields.find((field) => field.type === "checkbox-group");
  const selectedFeatures = buildSelectedFeatures(defaults);
  const conditionDefault =
    defaults?.categorySpecs?.condition !== undefined
      ? String(defaults.categorySpecs.condition)
      : defaults?.condition;

  useEffect(() => {
    if (!onPreviewChange) return;
    onPreviewChange({
      hideCondition,
      priceMode: isJobs ? "salary" : "aed",
      city: isJobs
        ? specs.location ?? ""
        : specs.city ?? specs.emirate ?? "",
      condition:
        !hideCondition && specs.condition
          ? (specs.condition as ListingCondition)
          : undefined,
      price: isJobs ? specs.salary ?? "" : undefined,
    });
  }, [
    hideCondition,
    isJobs,
    onPreviewChange,
    specs.city,
    specs.condition,
    specs.emirate,
    specs.location,
    specs.salary,
  ]);

  if (!categoryId) {
    return null;
  }
  if (
    remoteFields?.categoryId === categoryId &&
    remoteFields.fields.length === 0 &&
    !isDynamicCategory(categoryId)
  ) {
    return null;
  }
  if (allFields.length === 0 && !isDynamicCategory(categoryId)) {
    return null;
  }

  function onSpecChange(key: string, value: string) {
    setSpecs((prev) => {
      const next = { ...prev, [key]: value };
      // Cars/mobiles/electronics: changing brand clears a stale model + Other text.
      if (key === "brand") {
        next.model = "";
        next.modelOther = "";
      }
      return next;
    });

    if (!onPreviewChange) return;
    if (key === "condition" && !hideCondition) {
      onPreviewChange({ condition: value as ListingCondition });
    }
    if (key === "city" || key === "emirate" || (isJobs && key === "location")) {
      onPreviewChange({ city: value });
    }
    if (isJobs && key === "salary") {
      onPreviewChange({ price: value, priceMode: "salary" });
    }
    if (key === "position" || key === "company" || key === "brand" || key === "model") {
      onPreviewChange({
        title: [specs.brand, specs.model, specs.company, specs.position, value]
          .filter(Boolean)
          .join(" ")
          .trim(),
      });
    }
  }

  function optionsForField(field: CategoryFieldDefinition): CategoryFieldOption[] | undefined {
    if (field.key === "brand") {
      const brands = getBrandOptionsForCategory(categoryId);
      if (brands.length > 0) return brands;
    }
    if (
      field.key === "model" &&
      (categoryId === "cars" ||
        categoryId === "mobiles" ||
        categoryId === "electronics")
    ) {
      // Touch catalogEpoch so overrides re-render once they land.
      void catalogEpoch;
      if (!specs.brand?.trim()) return [];
      // While overrides hydrate, still show sync catalog models — never Other-only.
      return getModelsForBrand(categoryId, specs.brand);
    }
    return undefined;
  }

  return (
    <LocalizedTree>
      <Card key={`${categoryId}-${allFields.length}`} className={addListingStepCardClass}>
        {stepLabel ? (
          <p className="text-xs font-bold uppercase tracking-wide text-secondary">
            {stepLabel}
          </p>
        ) : null}
        <h2 className={`${stepLabel ? "mt-1" : ""} ${addListingStepTitleClass}`}>
          {heading}
        </h2>
        <p className={addListingStepDescClass}>
          الحقول تتغير تلقائياً حسب القسم — ابحث عن الماركة بكتابة أول حروفها.
        </p>

        <div className={addListingDynamicFieldsGridClass}>
          {fields.map((field) => {
            const spansFullWidth = field.type === "textarea";

            if (field.key === "condition") {
              return (
                <div
                  key={field.key}
                  className={`min-w-0 ${spansFullWidth ? "col-span-2" : ""}`}
                >
                  <Select
                    compact
                    defaultValue={
                      conditionDefault !== undefined
                        ? String(conditionDefault)
                        : undefined
                    }
                    label={field.label}
                    name={`spec_${field.key}`}
                    onChange={(event) => onSpecChange(field.key, event.target.value)}
                    options={field.options ?? []}
                    placeholder="اختر..."
                    required={field.required}
                  />
                  {errors[field.key] ? (
                    <FormMessage variant="error">{String(errors[field.key])}</FormMessage>
                  ) : null}
                </div>
              );
            }

            return (
              <div
                key={field.key}
                className={`min-w-0 ${spansFullWidth ? "col-span-2" : ""}`}
              >
                {renderField(
                  field,
                  defaults,
                  selectedFeatures,
                  onSpecChange,
                  optionsForField(field),
                  field.key === "model"
                    ? `model-${categoryId}-${specs.brand ?? ""}`
                    : undefined,
                  field.key === "brand" || field.key === "model"
                    ? (specs[field.key] ?? "")
                    : undefined,
                  field.key === "model" &&
                    categoryId === "cars" &&
                    catalogLoading &&
                    Boolean(specs.brand?.trim()) &&
                    (optionsForField(field)?.length ?? 0) === 0,
                )}
                {field.note ? (
                  <p className="mt-1 text-xs text-muted">{field.note}</p>
                ) : null}
                {errors[field.key] ? (
                  <FormMessage variant="error">{String(errors[field.key])}</FormMessage>
                ) : null}
              </div>
            );
          })}

          {featureField && fieldVisible(featureField, specs) ? (
            <div className="col-span-2 min-w-0">
              {renderField(featureField, defaults, selectedFeatures, onSpecChange)}
            </div>
          ) : null}
        </div>

        <div className={addListingStepFooterClass}>
          {isJobs ? (
            <p className="text-xs text-muted">
              إعلانات الوظائف لا تستخدم سعر درهم ولا حالة مستعمل/جديد — الراتب
              والموقع يظهران من الحقول أعلاه.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-2">
              <div className="col-span-2 sm:col-span-1">
                <Input
                  compact
                  defaultValue={defaults?.price}
                  inputMode="numeric"
                  label="السعر بالدرهم"
                  min="1"
                  name="price"
                  onChange={(event) =>
                    onPreviewChange?.({
                      price: event.target.value,
                      priceMode: "aed",
                    })
                  }
                  placeholder="اكتب السعر"
                  required
                  type="number"
                />
                {errors.price ? (
                  <FormMessage variant="error">{errors.price}</FormMessage>
                ) : null}
              </div>
              <label className="col-span-2 flex items-center gap-2 self-end pb-1 text-sm font-medium text-ink sm:col-span-1">
                <input
                  className="size-4 accent-primary"
                  defaultChecked={Boolean(defaults?.negotiable)}
                  name="negotiable"
                  type="checkbox"
                />
                قابل للتفاوض
              </label>
            </div>
          )}

          <div>
            <Textarea
              compact
              defaultValue={defaults?.description}
              label="الوصف"
              name="description"
              onChange={(event) =>
                onPreviewChange?.({ description: event.target.value })
              }
              placeholder="اكتب وصفاً واضحاً ومفصلاً للإعلان..."
              required
            />
            {errors.description ? (
              <FormMessage variant="error">{errors.description}</FormMessage>
            ) : null}
          </div>

          {showContact ? (
            <div>
              <Input
                compact
                defaultValue={defaults?.contactPhone}
                label="رقم التواصل (اختياري — يظهر للمهتمين فقط إذا أضفته)"
                name="contact"
                placeholder="05xxxxxxxx"
                type="tel"
              />
              <p className="mt-1 text-xs text-muted">
                يُستخدم للاتصال وواتساب. اتركه فارغاً لإخفاء الرقم.
              </p>
              {errors.contact ? (
                <FormMessage variant="error">{errors.contact}</FormMessage>
              ) : null}
            </div>
          ) : null}

          {errors.title ? (
            <FormMessage variant="error">{errors.title}</FormMessage>
          ) : null}
        </div>
      </Card>
    </LocalizedTree>
  );
}
