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

type MarketHeroSearchProps = {
  categories: Category[];
};

export function MarketHeroSearch({ categories }: MarketHeroSearchProps) {
  const locale = useLocale();
  const cities = useMarketplaceLocations();
  const labels = getHomeSearchLabels(locale);
  const priceOptions = getHomeSearchPriceOptions(locale);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  return (
    <form action="/search" className="market-hero-search" data-search-anchor data-no-tx>
      <div className="market-hero-search__accent" />
      <div className="market-hero-search__body">
        <div className="market-hero-search__grid">
          <div className="market-hero-search__query">
            <span className="market-hero-search__label">{labels.query}</span>
            <div className="market-hero-search__field market-hero-search__field--query">
              <Icon aria-hidden className="shrink-0 text-[#B8955F]" name="search" size={18} />
              <SearchTypeahead
                bare
                className="market-hero-search__typeahead min-w-0 flex-1"
                inputClassName="w-full min-w-0 bg-transparent text-sm font-semibold text-ink outline-none md:text-base"
                inputId={SMART_SEARCH_INPUT_ID}
                label=""
                name="q"
                placeholder=""
                selectedFilters={{ category, city }}
              />
            </div>
          </div>

          <label className="market-hero-search__slot">
            <span className="market-hero-search__label">{labels.category}</span>
            <span className="market-hero-search__control">
              <Icon
                aria-hidden
                className="market-hero-search__control-icon"
                name="grid"
                size={14}
              />
              <select
                aria-label={labels.category}
                className="market-hero-search__field market-hero-search__select"
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
            </span>
          </label>

          <label className="market-hero-search__slot">
            <span className="market-hero-search__label">{labels.city}</span>
            <span className="market-hero-search__control">
              <Icon
                aria-hidden
                className="market-hero-search__control-icon"
                name="map"
                size={14}
              />
              <select
                aria-label={labels.city}
                className="market-hero-search__field market-hero-search__select"
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
            </span>
          </label>

          <label className="market-hero-search__slot">
            <span className="market-hero-search__label">{labels.price}</span>
            <span className="market-hero-search__control">
              <Icon
                aria-hidden
                className="market-hero-search__control-icon"
                name="wallet"
                size={14}
              />
              <select
                aria-label={labels.price}
                className="market-hero-search__field market-hero-search__select"
                defaultValue=""
                name="price"
              >
                {priceOptions.map((option) => (
                  <option key={option.value || "any"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </span>
          </label>

          <button className="market-hero-search__submit sooqna-gold-gradient motion-press" type="submit">
            <Icon aria-hidden name="search" size={16} />
            <span>{labels.submit}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
