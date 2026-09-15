"use client";

import { useState } from "react";
import type { Category } from "@/types";
import { cities } from "@/shared/constants/locations";
import { Icon } from "@/shared/ui/Icon";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import {
  HOME_SEARCH_LABELS,
  HOME_SEARCH_PRICE_OPTIONS,
} from "@/features/home/shared/home-search-fields";
import { SearchTypeahead } from "@/features/search/components/SearchTypeahead";
import { SMART_SEARCH_INPUT_ID } from "@/features/search/focus-smart-search";

type MarketHeroSearchProps = {
  categories: Category[];
};

export function MarketHeroSearch({ categories }: MarketHeroSearchProps) {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  return (
    <LocalizedTree>
      <form action="/search" className="market-hero-search" data-search-anchor>
        <div className="market-hero-search__accent" />
        <div className="market-hero-search__body">
          <div className="market-hero-search__grid">
            <div className="market-hero-search__query">
              <span className="market-hero-search__label">{HOME_SEARCH_LABELS.query}</span>
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
              <span className="market-hero-search__label">{HOME_SEARCH_LABELS.category}</span>
              <span className="market-hero-search__chip">
                <Icon aria-hidden className="market-hero-search__chip-icon" name="grid" size={14} />
                <span className="market-hero-search__chip-text">{HOME_SEARCH_LABELS.category}</span>
                <select
                  aria-label={HOME_SEARCH_LABELS.category}
                  className="market-hero-search__field market-hero-search__select"
                  name="category"
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  <option value="">{HOME_SEARCH_LABELS.categoryAll}</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="market-hero-search__slot">
              <span className="market-hero-search__label">{HOME_SEARCH_LABELS.city}</span>
              <span className="market-hero-search__chip">
                <Icon aria-hidden className="market-hero-search__chip-icon" name="map" size={14} />
                <span className="market-hero-search__chip-text">{HOME_SEARCH_LABELS.city}</span>
                <select
                  aria-label={HOME_SEARCH_LABELS.city}
                  className="market-hero-search__field market-hero-search__select"
                  name="city"
                  onChange={(event) => setCity(event.target.value)}
                  value={city}
                >
                  <option value="">{HOME_SEARCH_LABELS.cityAll}</option>
                  {cities.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="market-hero-search__slot">
              <span className="market-hero-search__label">{HOME_SEARCH_LABELS.price}</span>
              <span className="market-hero-search__chip">
                <Icon aria-hidden className="market-hero-search__chip-icon" name="wallet" size={14} />
                <span className="market-hero-search__chip-text">{HOME_SEARCH_LABELS.price}</span>
                <select
                  aria-label={HOME_SEARCH_LABELS.price}
                  className="market-hero-search__field market-hero-search__select"
                  defaultValue=""
                  name="price"
                >
                  {HOME_SEARCH_PRICE_OPTIONS.map((option) => (
                    <option key={option.value || "any"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <button className="market-hero-search__submit sooqna-gold-gradient motion-press" type="submit">
              <Icon aria-hidden name="search" size={16} />
              <span>{HOME_SEARCH_LABELS.submit}</span>
            </button>
          </div>
        </div>
      </form>
    </LocalizedTree>
  );
}
