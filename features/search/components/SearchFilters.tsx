"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { Category, City } from "@/types";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Icon } from "@/shared/ui/Icon";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import {
  SearchTypeahead,
  type SearchSuggestion,
} from "./SearchTypeahead";
import { CategorySmartFields } from "./CategorySmartFields";
import {
  activeFilterCount,
  buildSearchUrl,
  type SearchFilterState,
} from "./search-url";

type SearchFiltersProps = {
  action?: string;
  categories: Category[];
  cities: City[];
  countries: {
    id: string;
    name: string;
  }[];
  layout?: "bar" | "sidebar";
  selectedFilters: SearchFilterState;
  showCategory?: boolean;
  suggestions?: SearchSuggestion[];
};

const sortOptions = [
  { label: "الأحدث", value: "newest" },
  { label: "الأقل سعراً", value: "price_asc" },
  { label: "الأعلى سعراً", value: "price_desc" },
];

const conditionOptions = [
  { label: "الكل", value: "" },
  { label: "جديد", value: "new" },
  { label: "مستعمل", value: "used" },
  { label: "ممتاز", value: "excellent" },
];

type FilterFieldsProps = {
  categories: Category[];
  cities: City[];
  compact: boolean;
  draft: SearchFilterState;
  setDraft: (next: SearchFilterState) => void;
  showCategory: boolean;
  suggestions: SearchSuggestion[];
};

function FilterFields({
  categories,
  cities,
  compact,
  draft,
  setDraft,
  showCategory,
  suggestions,
}: FilterFieldsProps) {
  const selectedCategory =
    categories.find((category) => category.id === (draft.category || "")) ??
    undefined;

  return (
    <>
      <SearchTypeahead
        compact={compact}
        defaultValue={draft.query}
        label="كلمة البحث"
        name="q"
        placeholder="سيارة، هاتف، عقار..."
        selectedFilters={draft}
        suggestions={suggestions}
      />

      <p className="pt-1 text-[0.7rem] font-bold text-muted">الموقع</p>
      <div className="grid grid-cols-2 gap-2">
        <Select
          compact={compact}
          label="الإمارة"
          name="city"
          onChange={(event) =>
            setDraft({ ...draft, city: event.target.value, area: "" })
          }
          options={[
            { label: "جميع الإمارات", value: "" },
            ...cities.map((city) => ({ label: city.name, value: city.name })),
          ]}
          value={draft.city ?? ""}
        />
        {showCategory ? (
          <Select
            compact={compact}
            label="التصنيف"
            name="category"
            onChange={(event) =>
              setDraft({
                ...draft,
                category: event.target.value,
                specs: {},
                ranges: {},
                subcategory: "",
                area: "",
              })
            }
            options={[
              { label: "كل التصنيفات", value: "" },
              ...categories.map((category) => ({
                label: category.name,
                value: category.id,
              })),
            ]}
            value={draft.category ?? ""}
          />
        ) : (
          <>
            <input name="category" type="hidden" value={draft.category ?? ""} />
            <Select
              compact={compact}
              defaultValue={draft.sort}
              label="الترتيب"
              name="sort"
              options={sortOptions}
            />
          </>
        )}
      </div>

      <p className="pt-1 text-[0.7rem] font-bold text-muted">تفاصيل أدق</p>
      <CategorySmartFields
        category={selectedCategory}
        compact={compact}
        draft={draft}
        onChange={setDraft}
      />

      <p className="pt-1 text-[0.7rem] font-bold text-muted">السعر والحالة</p>
      <div className={showCategory ? "grid grid-cols-2 gap-2" : ""}>
        <Select
          compact={compact}
          defaultValue={draft.condition}
          label="الحالة"
          name="condition"
          options={conditionOptions}
        />
        {showCategory ? (
          <Select
            compact={compact}
            defaultValue={draft.sort}
            label="الترتيب"
            name="sort"
            options={sortOptions}
          />
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          compact={compact}
          defaultValue={draft.minPrice}
          inputMode="numeric"
          label="من (د.إ)"
          min="0"
          name="minPrice"
          placeholder="0"
          type="number"
        />
        <Input
          compact={compact}
          defaultValue={draft.maxPrice}
          inputMode="numeric"
          label="إلى (د.إ)"
          min="0"
          name="maxPrice"
          placeholder="أي سعر"
          type="number"
        />
      </div>
      <input name="country" type="hidden" value={draft.country ?? ""} />
    </>
  );
}

export function SearchFilters({
  action = "/search",
  categories,
  cities,
  layout = "bar",
  selectedFilters,
  showCategory = true,
  suggestions = [],
}: SearchFiltersProps) {
  const isSidebar = layout === "sidebar";
  const router = useRouter();
  const titleId = useId();
  const [sheetOpen, setSheetOpen] = useState(false);
  const urlSignature = buildSearchUrl(selectedFilters, undefined, action);
  const [seenSignature, setSeenSignature] = useState(urlSignature);
  const [draft, setDraft] = useState<SearchFilterState>(selectedFilters);

  if (seenSignature !== urlSignature) {
    setSeenSignature(urlSignature);
    setDraft(selectedFilters);
  }

  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sheetOpen]);

  const appliedCount = activeFilterCount(selectedFilters);
  const resetHref = action.split("?")[0] || "/search";

  const fieldProps: FilterFieldsProps = {
    categories,
    cities,
    compact: true,
    draft,
    setDraft,
    showCategory,
    suggestions,
  };

  const footer = (
    <div className="grid grid-cols-2 gap-2">
      <Button href={resetHref} size="sm" type="button" variant="secondary">
        إعادة تعيين
      </Button>
      <Button className="motion-press w-full" size="sm" type="submit" variant="primary">
        تطبيق الفلاتر
      </Button>
    </div>
  );

  if (!isSidebar) {
    return (
      <LocalizedTree>
        <div className="marketplace-panel p-5 md:p-6">
          <form action={action} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FilterFields {...fieldProps} compact={false} />
            <div className="md:col-span-2 lg:col-span-4">{footer}</div>
          </form>
        </div>
      </LocalizedTree>
    );
  }

  const sheet =
    sheetOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            aria-labelledby={titleId}
            aria-modal="true"
            className="fixed inset-0 z-[100] lg:hidden"
            role="dialog"
          >
            <button
              aria-label="إغلاق الفلاتر"
              className="absolute inset-0 bg-ink/45"
              onClick={() => setSheetOpen(false)}
              type="button"
            />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl border border-border bg-surface shadow-[var(--shadow-lg)]">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                <div>
                  <h2 className="text-sm font-black text-ink" id={titleId}>
                    فلاتر البحث
                  </h2>
                  <p className="text-[11px] text-muted">
                    اختصر النتائج بالإمارة والسعر والمواصفات
                  </p>
                </div>
                <button
                  aria-label="إغلاق"
                  className="focus-ring grid size-9 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
                  onClick={() => setSheetOpen(false)}
                  type="button"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
              <form action={action} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
                  <FilterFields {...fieldProps} />
                </div>
                <div className="shrink-0 border-t border-border/70 bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  {footer}
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <LocalizedTree>
      <div className="sticky top-[4.25rem] z-30 lg:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-border bg-surface/95 p-1.5 shadow-[var(--shadow-card)] backdrop-blur">
          <button
            aria-expanded={sheetOpen}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-secondary-soft/80 px-3 text-sm font-bold text-ink"
            onClick={() => setSheetOpen(true)}
            type="button"
          >
            <Icon className="text-secondary" name="filter" size={16} />
            <span>فلاتر</span>
            {appliedCount > 0 ? (
              <span className="rounded-full bg-[#c9a45c] px-2 py-0.5 text-[0.65rem] font-black text-[#0b1628]">
                {appliedCount}
              </span>
            ) : null}
          </button>
          <label className="relative inline-flex min-h-11 w-[9.25rem] shrink-0 items-center">
            <span className="sr-only">الترتيب</span>
            <select
              aria-label="الترتيب"
              className="focus-ring h-11 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface pe-8 ps-3 text-xs font-bold text-ink"
              onChange={(event) => {
                router.push(
                  buildSearchUrl(
                    { ...selectedFilters, sort: event.target.value },
                    undefined,
                    action,
                  ),
                );
              }}
              value={selectedFilters.sort || "newest"}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Icon
              className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 rotate-90 text-muted"
              name="chevron-left"
              size={14}
            />
          </label>
        </div>
      </div>

      <div className="marketplace-panel hidden max-h-[calc(100vh-6.5rem)] flex-col overflow-hidden p-0 lg:flex">
        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 pt-4">
            <h2 className="text-sm font-bold text-ink">صفِّ بحثك</h2>
            <p className="text-[11px] leading-5 text-muted">
              ابدأ بالإمارة والتصنيف، ثم ضيّق بالسعر والمواصفات.
            </p>
            <FilterFields {...fieldProps} />
          </div>
          <div className="shrink-0 border-t border-border/70 bg-surface px-4 py-3">
            {footer}
          </div>
        </form>
      </div>

      {sheet}
    </LocalizedTree>
  );
}
