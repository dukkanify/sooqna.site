"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/types";
import { CategoryThumbnail } from "@/shared/components/CategoryThumbnail";
import { Card } from "@/shared/ui/Card";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import type { AddListingErrors } from "./types";
import {
  isOtherOptionValue,
  subcategoryOptionsWithOther,
} from "./subcategory-other";
import {
  addListingStepCardClass,
  addListingStepDescClass,
  addListingStepTitleClass,
} from "./utils";

type CategorySelectionStepProps = {
  categories: Category[];
  errors: AddListingErrors;
  onSelectCategory: (categoryId: string) => void;
  onSubcategoryChange?: (subcategory: string) => void;
  selectedCategory?: Category;
  selectedCategoryId: string;
  selectedSubcategory?: string;
};

export function CategorySelectionStep({
  categories,
  errors,
  onSelectCategory,
  onSubcategoryChange,
  selectedCategory,
  selectedCategoryId,
  selectedSubcategory = "",
}: CategorySelectionStepProps) {
  const [subcategory, setSubcategory] = useState("");
  const [subcategoryOther, setSubcategoryOther] = useState("");

  useEffect(() => {
    setSubcategory("");
    setSubcategoryOther("");
  }, [selectedCategoryId]);

  const showSubcategory = Boolean(selectedCategory);
  const options = subcategoryOptionsWithOther(selectedCategory?.subcategories);
  const otherSelected = isOtherOptionValue(subcategory);

  return (
    <Card className={addListingStepCardClass}>
      <h2 className={addListingStepTitleClass}>1. اختر القسم</h2>
      <p className={addListingStepDescClass}>
        اختر القسم الأنسب لإعلانك ليظهر أمام المشترين المناسبين.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-5">
        {categories.map((category) => {
          const isSelected = category.id === selectedCategoryId;

          return (
            <button
              key={category.id}
              aria-pressed={isSelected}
              className={`mobile-home-categories__card gap-1 rounded-[var(--radius-lg)] border p-2 transition sm:gap-1.5 sm:rounded-[var(--radius-xl)] sm:p-2.5 ${
                isSelected
                  ? "border-secondary bg-secondary-soft shadow-[var(--shadow-xs)]"
                  : "border-border bg-surface hover:border-secondary/40"
              }`}
              onClick={() => onSelectCategory(category.id)}
              type="button"
            >
              <CategoryThumbnail
                category={category}
                className="mx-0"
                selected={isSelected}
                variant="compact"
              />
              <span className="mobile-home-categories__label line-clamp-2 text-[10px] font-semibold leading-tight text-ink sm:text-xs">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
      {errors.category ? (
        <FormMessage variant="error">{errors.category}</FormMessage>
      ) : null}

      {showSubcategory ? (
        <div className="mt-4 grid gap-2">
          <Select
            key={`${selectedCategoryId}:${selectedSubcategory || "none"}`}
            defaultValue={selectedSubcategory || undefined}
            label={
              selectedCategoryId === "jobs"
                ? "نوع الإعلان"
                : "القسم الفرعي (اختياري)"
            }
            name="subcategory"
            onChange={(event) => {
              const next = event.target.value;
              setSubcategory(next);
              if (!isOtherOptionValue(next)) setSubcategoryOther("");
              onSubcategoryChange?.(next);
            }}
            optionsAreUgc
            options={options}
            placeholder="اختر..."
            value={subcategory}
          />
          {otherSelected ? (
            <Input
              error={errors.subcategory}
              hint="سيُحفظ هذا الوصف كقسم فرعي للإعلان، ويمكن للإدارة اعتماده لاحقاً."
              label="صف القسم الفرعي"
              maxLength={60}
              name="subcategoryOther"
              onChange={(event) => setSubcategoryOther(event.target.value)}
              placeholder="مثال: كلاسيكية، معدات ثقيلة…"
              required
              value={subcategoryOther}
            />
          ) : (
            <p className="text-xs text-muted">
              {selectedCategoryId === "jobs"
                ? "توظيف (وظائف) للإعلان عن شاغر، وباحثون عن عمل لمن يبحث عن وظيفة."
                : "اختر من القائمة، أو «أخرى» لكتابة وصفك إن لم تجد القسم المناسب."}
            </p>
          )}
          {errors.subcategory && !otherSelected ? (
            <FormMessage variant="error">{errors.subcategory}</FormMessage>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
