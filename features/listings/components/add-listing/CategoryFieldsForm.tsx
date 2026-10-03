"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { CategoryFieldDefinition, CategorySpecs, Listing, ListingCondition } from "@/types";
import { getCategoryFields, isDynamicCategory, mergeFieldVisibilityFromDefaults } from "@/shared/constants/category-fields";
import { getModelsForBrand } from "@/shared/constants/product-brand-models";
import { getBrandOptionsForCategory } from "@/shared/constants/product-brands";
import { BrandCombobox } from "@/shared/ui/BrandCombobox";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { UaePhoneInput } from "@/shared/ui/UaePhoneInput";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import type { CategoryFieldOption } from "@/types";
import {
  fieldVisibleForSpecs,
  withVisibilityContext,
} from "@/shared/listings/category-field-visibility";
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
  title?: string;
};

type CategoryFieldsFormProps = {
  categoryId: string;
  defaults?: CategoryFieldsDefaults;
  errors: CategoryFieldErrors;
  heading?: string;
  listing?: Listing;
  onPreviewChange?: (patch: {
    city?: string;
    condition?: ListingCondition | "";
    description?: string;
    hideCondition?: boolean;
    negotiable?: boolean;
    price?: string;
    priceMode?: "aed" | "salary";
    title?: string;
  }) => void;
  showContact?: boolean;
  stepLabel?: string;
  /** Step-1 / listing subcategory — drives hideWhen (EV, accessories). */
  subcategory?: string;
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

function specsFromDefaults(
  defaults: CategoryFieldsDefaults | undefined,
): Record<string, string> {
  const initial: Record<string, string> = {};
  for (const [key, value] of Object.entries(defaults?.categorySpecs ?? {})) {
    if (value === undefined || value === null || typeof value === "boolean") {
      continue;
    }
    const text = String(value).trim();
    if (text) initial[key] = text;
  }
  if (!initial.condition && defaults?.condition) {
    initial.condition = String(defaults.condition);
  }
  return initial;
}

function optionsWithStoredValue(
  options: CategoryFieldOption[],
  stored: string | undefined,
): CategoryFieldOption[] {
  const value = stored?.trim();
  if (!value) return options;
  if (options.some((option) => option.value === value)) return options;
  return [{ label: value, value }, ...options];
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
    // Always force an explicit choice on create — never silently submit the
    // first option (دبي / جديد / ذكر / …). Edit flows pass defaultValue.
    return (
      <Select
        key={field.key}
        compact
        defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
        label={field.label}
        name={name}
        onChange={(event) => onSpecChange(field.key, event.target.value)}
        options={options}
        placeholder="اختر..."
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
  subcategory = "",
}: CategoryFieldsFormProps) {
  const isJobs = categoryId === "jobs";
  const isFood = categoryId === "food";
  const hideCondition =
    isJobs ||
    isFood ||
    categoryId === "real-estate" ||
    categoryId === "services";
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

  const allFields = mergeFieldVisibilityFromDefaults(
    categoryId,
    remoteFields?.categoryId === categoryId
      ? remoteFields.fields
      : fallbackFields,
  );

  const [specs, setSpecs] = useState<Record<string, string>>(() =>
    specsFromDefaults(defaults),
  );
  const defaultsFingerprint = JSON.stringify(defaults?.categorySpecs ?? {});

  useEffect(() => {
    const incoming = specsFromDefaults(defaults);
    setSpecs((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [key, value] of Object.entries(incoming)) {
        if (!next[key]) {
          next[key] = value;
          changed = true;
          continue;
        }
        // Hydrate splits "محمد بن زايد – أبوظبي" into emirate + area.
        if (
          (key === "emirate" || key === "city" || key === "location") &&
          /[—–\-|/,،]/.test(next[key]) &&
          value &&
          next[key] !== value
        ) {
          next[key] = value;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // Fill missing keys when a full listing payload arrives — do not reset edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fingerprint of stored specs
  }, [defaultsFingerprint]);

  const visibilitySpecs = withVisibilityContext(specs, { subcategory });
  const fields = allFields.filter(
    (field) =>
      field.type !== "checkbox-group" &&
      fieldVisibleForSpecs(field, visibilitySpecs),
  );
  const featureField = allFields.find((field) => field.type === "checkbox-group");
  const selectedFeatures = buildSelectedFeatures(defaults);
  const conditionDefault =
    specs.condition ||
    (defaults?.categorySpecs?.condition !== undefined
      ? String(defaults.categorySpecs.condition)
      : defaults?.condition);

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
          : "",
      // Keep price a string — never patch `undefined` over existing preview price.
      ...(isJobs ? { price: specs.salary ?? "" } : {}),
    });
    // Sync category-derived preview fields only when those values change —
    // intentionally omit onPreviewChange identity to avoid update loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable preview patch
  }, [
    hideCondition,
    isJobs,
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
  }

  function optionsForField(field: CategoryFieldDefinition): CategoryFieldOption[] | undefined {
    const stored = specs[field.key] ?? String(getSpecValue(defaults, field.key) ?? "");
    if (field.key === "brand") {
      const brands = getBrandOptionsForCategory(categoryId);
      if (brands.length > 0) return optionsWithStoredValue(brands, stored);
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
      return optionsWithStoredValue(
        getModelsForBrand(categoryId, specs.brand),
        stored,
      );
    }
    if (field.options?.length) {
      return optionsWithStoredValue(field.options, stored);
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
        {subcategory ? (
          <input name="subcategory" type="hidden" value={subcategory} />
        ) : null}

        <div className={addListingDynamicFieldsGridClass}>
          {fields.map((field) => {
            const spansFullWidth = field.type === "textarea";
            const sectionHeading = field.section ? (
              <div className="col-span-2 min-w-0 pt-1">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
                  {field.section}
                </h3>
              </div>
            ) : null;

            if (field.key === "emirate") {
              const emirateValue = specs.emirate ?? "";
              return (
                <Fragment key={field.key}>
                  {sectionHeading}
                  <div
                    className={`min-w-0 ${spansFullWidth ? "col-span-2" : ""}`}
                  >
                    <Select
                      compact
                      label={field.label}
                      name={`spec_${field.key}`}
                      onChange={(event) =>
                        onSpecChange(field.key, event.target.value)
                      }
                      options={optionsWithStoredValue(
                        field.options ?? [],
                        emirateValue,
                      )}
                      placeholder="اختر..."
                      required={field.required}
                      value={emirateValue}
                    />
                    {errors[field.key] ? (
                      <FormMessage variant="error">
                        {String(errors[field.key])}
                      </FormMessage>
                    ) : null}
                  </div>
                </Fragment>
              );
            }

            if (field.key === "city") {
              const cityValue = specs.city ?? "";
              return (
                <Fragment key={field.key}>
                  {sectionHeading}
                  <div
                    className={`min-w-0 ${spansFullWidth ? "col-span-2" : ""}`}
                  >
                    <Input
                      compact
                      label={field.label}
                      name={`spec_${field.key}`}
                      onChange={(event) =>
                        onSpecChange(field.key, event.target.value)
                      }
                      placeholder={field.placeholder}
                      required={field.required}
                      value={cityValue}
                    />
                    {field.note ? (
                      <p className="mt-1 text-xs text-muted">{field.note}</p>
                    ) : null}
                    {errors[field.key] ? (
                      <FormMessage variant="error">
                        {String(errors[field.key])}
                      </FormMessage>
                    ) : null}
                  </div>
                </Fragment>
              );
            }

            if (field.key === "condition") {
              return (
                <Fragment key={field.key}>
                  {sectionHeading}
                  <div
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
                      options={optionsWithStoredValue(
                        field.options ?? [],
                        conditionDefault !== undefined
                          ? String(conditionDefault)
                          : undefined,
                      )}
                      placeholder="اختر..."
                      required={field.required}
                    />
                    {errors[field.key] ? (
                      <FormMessage variant="error">{String(errors[field.key])}</FormMessage>
                    ) : null}
                  </div>
                </Fragment>
              );
            }

            return (
              <Fragment key={field.key}>
                {sectionHeading}
                <div
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
                    specs[field.key] ??
                      (getSpecValue(defaults, field.key) !== undefined
                        ? String(getSpecValue(defaults, field.key))
                        : undefined),
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
              </Fragment>
            );
          })}

          {featureField && fieldVisibleForSpecs(featureField, visibilitySpecs) ? (
            <div className="col-span-2 min-w-0">
              {renderField(featureField, defaults, selectedFeatures, onSpecChange)}
            </div>
          ) : null}
        </div>

        <div className={addListingStepFooterClass}>
          <div>
            <Input
              compact
              defaultValue={defaults?.title}
              label="عنوان الإعلان"
              name="title"
              onChange={(event) =>
                onPreviewChange?.({ title: event.target.value })
              }
              placeholder="مثال: تويوتا كامري 2022 بحالة ممتازة"
              required
            />
            <p className="mt-1 text-xs text-muted">
              عنوان واضح يساعد المشترين على إيجاد إعلانك — 8 أحرف على الأقل.
            </p>
            {errors.title ? (
              <FormMessage variant="error">{errors.title}</FormMessage>
            ) : null}
          </div>

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
                  onChange={(event) =>
                    onPreviewChange?.({ negotiable: event.target.checked })
                  }
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
              <UaePhoneInput
                compact
                defaultValue={defaults?.contactPhone}
                error={errors.contact}
                label="رقم التواصل (اختياري — يظهر للمهتمين فقط إذا أضفته)"
                name="contact"
              />
              <p className="mt-1 text-xs text-muted">
                يُستخدم للاتصال وواتساب. اتركه فارغاً لإخفاء الرقم.
              </p>
            </div>
          ) : null}
        </div>
      </Card>
    </LocalizedTree>
  );
}
