"use client";

import type { Category } from "@/types";
import { cities } from "@/shared/constants/locations";
import { Icon } from "@/shared/ui/Icon";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import {
  HOME_SEARCH_LABELS,
  HOME_SEARCH_PRICE_OPTIONS,
} from "@/features/home/shared/home-search-fields";

type MarketHeroSearchProps = {
  categories: Category[];
};

export function MarketHeroSearch({ categories }: MarketHeroSearchProps) {
  return (
    <LocalizedTree>
      <form action="/search" className="market-hero-search" data-search-anchor>
        <div className="market-hero-search__accent" />
        <div className="market-hero-search__body">
          <div className="market-hero-search__grid">
            <label className="market-hero-search__query">
              <span className="market-hero-search__label">{HOME_SEARCH_LABELS.query}</span>
              <div className="market-hero-search__field market-hero-search__field--query">
                <Icon aria-hidden className="shrink-0 text-[#B8955F]" name="search" size={18} />
                <input
                  className="w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-muted/55 md:text-base"
                  name="q"
                  placeholder={HOME_SEARCH_LABELS.queryPlaceholder}
                  type="search"
                />
              </div>
            </label>

            <label className="market-hero-search__slot">
              <span className="market-hero-search__label">{HOME_SEARCH_LABELS.category}</span>
              <span className="market-hero-search__chip">
                <Icon aria-hidden className="market-hero-search__chip-icon" name="grid" size={14} />
                <select
                  className="market-hero-search__field market-hero-search__select"
                  defaultValue=""
                  name="category"
                >
                  <option value="">{HOME_SEARCH_LABELS.categoryAll}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="market-hero-search__slot">
              <span className="market-hero-search__label">{HOME_SEARCH_LABELS.city}</span>
              <span className="market-hero-search__chip">
                <Icon aria-hidden className="market-hero-search__chip-icon" name="map" size={14} />
                <select
                  className="market-hero-search__field market-hero-search__select"
                  defaultValue=""
                  name="city"
                >
                  <option value="">{HOME_SEARCH_LABELS.cityAll}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="market-hero-search__slot">
              <span className="market-hero-search__label">{HOME_SEARCH_LABELS.price}</span>
              <span className="market-hero-search__chip">
                <Icon aria-hidden className="market-hero-search__chip-icon" name="wallet" size={14} />
                <select
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
