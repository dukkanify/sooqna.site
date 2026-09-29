"use client";

import { useTx } from "@/shared/i18n/useTx";
import {
  MARKETPLACE_CURRENCY,
  PRICE_RANGE_ERROR_AR,
  isPriceRangeInverted,
} from "@/features/search/lib/price-range";
import type { SearchFilterState } from "./search-url";

type PriceRangeFieldsProps = {
  compact?: boolean;
  draft: SearchFilterState;
  /** Shorter heading for mobile easy mode. */
  easy?: boolean;
  onChange: (next: SearchFilterState) => void;
};

/**
 * Clear from–to price filter with AED currency and live min ≤ max validation.
 */
export function PriceRangeFields({
  compact = false,
  draft,
  easy = false,
  onChange,
}: PriceRangeFieldsProps) {
  const t = useTx();
  const inverted = isPriceRangeInverted(draft.minPrice, draft.maxPrice);
  const error = inverted ? t(PRICE_RANGE_ERROR_AR) : undefined;

  const setBound = (bound: "minPrice" | "maxPrice", raw: string) => {
    const cleaned = raw.replace(/[^\d]/g, "");
    onChange({ ...draft, [bound]: cleaned });
  };

  const fieldClass = `focus-ring w-full min-w-0 rounded-[var(--radius-xl)] border bg-surface pe-12 text-ink shadow-[var(--shadow-xs)] placeholder:text-muted/60 transition ${compact ? "min-h-9 rounded-lg ps-3 text-xs font-medium" : "min-h-11 ps-4 text-sm font-medium"} ${inverted ? "border-error bg-error-soft/30" : "border-border"}`;
  const labelClass = compact
    ? "text-xs font-semibold text-muted"
    : "text-sm font-medium text-ink";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="pt-0.5 text-[0.7rem] font-bold text-muted">
          {easy ? t("السعر") : t("السعر من – إلى")}
        </p>
        <span className="text-[0.65rem] font-bold tracking-wide text-muted">
          {MARKETPLACE_CURRENCY}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid min-w-0 gap-1">
          <span className={labelClass}>{t("السعر من")}</span>
          <span className="relative block min-w-0">
            <input
              aria-invalid={inverted || undefined}
              className={fieldClass}
              inputMode="numeric"
              min={0}
              name="minPrice"
              onChange={(event) => setBound("minPrice", event.target.value)}
              placeholder="0"
              type="number"
              value={draft.minPrice ?? ""}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[0.65rem] font-bold text-muted"
            >
              {MARKETPLACE_CURRENCY}
            </span>
          </span>
        </label>
        <label className="grid min-w-0 gap-1">
          <span className={labelClass}>{t("السعر إلى")}</span>
          <span className="relative block min-w-0">
            <input
              aria-invalid={inverted || undefined}
              className={fieldClass}
              inputMode="numeric"
              min={0}
              name="maxPrice"
              onChange={(event) => setBound("maxPrice", event.target.value)}
              placeholder={t("أي سعر")}
              type="number"
              value={draft.maxPrice ?? ""}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[0.65rem] font-bold text-muted"
            >
              {MARKETPLACE_CURRENCY}
            </span>
          </span>
        </label>
      </div>
      {error ? (
        <p className="text-xs font-medium text-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-[0.65rem] font-medium text-muted">
          {t("أدخل الحد الأدنى والأقصى بالدرهم الإماراتي")}
        </p>
      )}
    </div>
  );
}
