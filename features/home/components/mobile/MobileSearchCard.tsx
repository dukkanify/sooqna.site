"use client";

import { useState } from "react";
import type { Category } from "@/types";
import { useMarketplaceLocations } from "@/shared/hooks/useMarketplaceLocations";
import { Icon } from "@/shared/ui/Icon";
import { useLocale } from "@/shared/i18n/useLocale";
import { txLocation } from "@/shared/i18n/tx";
import {
  getHomeSearchLabels,
  getHomeSearchPriceOptions,
} from "@/features/home/shared/home-search-fields";
import { SearchTypeahead } from "@/features/search/components/SearchTypeahead";
import { SMART_SEARCH_INPUT_ID } from "@/features/search/focus-smart-search";

type MobileSearchCardProps = {
  categories: Category[];
};

export function MobileSearchCard({ categories }: MobileSearchCardProps) {
  const locale = useLocale();
  const cities = useMarketplaceLocations();
  const labels = getHomeSearchLabels(locale);
  const priceOptions = getHomeSearchPriceOptions(locale);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  return (
    <section
      aria-label={labels.submit}
      className="mobile-home-search-card"
      data-no-tx
      data-search-anchor
    >
      <form action="/search" className="mobile-home-search-card__panel">
        <div className="mobile-home-search-card__input-row">
          <Icon
            aria-hidden
            className="mobile-home-search-card__search-icon"
            name="search"
            size={16}
          />
          <span className="sr-only">{labels.query}</span>
          <SearchTypeahead
            bare
            className="mobile-home-search-card__typeahead min-w-0 flex-1"
            inputClassName="mobile-home-search-card__input"
            inputId={SMART_SEARCH_INPUT_ID}
            label=""
            name="q"
            placeholder={labels.queryPlaceholder}
            selectedFilters={{ category, city }}
          />
        </div>

        <div className="mobile-home-search-card__filters">
          <label className="mobile-home-search-card__chip">
            <Icon
              aria-hidden
              className="mobile-home-search-card__chip-icon"
              name="grid"
              size={14}
            />
            <span className="mobile-home-search-card__chip-label">
              {labels.category}
            </span>
            <select
              aria-label={labels.category}
              className="mobile-home-search-card__chip-select"
              name="category"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">{labels.categoryAll}</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {locale === "en" ? txLocation(locale, item.name) : item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="mobile-home-search-card__chip">
            <Icon
              aria-hidden
              className="mobile-home-search-card__chip-icon"
              name="map-pin"
              size={14}
            />
            <span className="mobile-home-search-card__chip-label">
              {labels.city}
            </span>
            <select
              aria-label={labels.city}
              className="mobile-home-search-card__chip-select"
              name="city"
              onChange={(event) => setCity(event.target.value)}
              value={city}
            >
              <option value="">{labels.cityAll}</option>
              {cities.map((item) => (
                <option key={item.id} value={item.name}>
                  {txLocation(locale, item.name)}
                </option>
              ))}
            </select>
          </label>

          <label className="mobile-home-search-card__chip">
            <Icon
              aria-hidden
              className="mobile-home-search-card__chip-icon"
              name="coins"
              size={14}
            />
            <span className="mobile-home-search-card__chip-label">
              {labels.price}
            </span>
            <select
              aria-label={labels.price}
              className="mobile-home-search-card__chip-select"
              defaultValue=""
              name="price"
            >
              {priceOptions.map((option) => (
                <option key={option.value || "any"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button className="mobile-home-search-card__submit" type="submit">
            {labels.submit}
          </button>
        </div>
      </form>
    </section>
  );
}
