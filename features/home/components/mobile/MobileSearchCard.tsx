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

type MobileSearchCardProps = {
  categories: Category[];
};

export function MobileSearchCard({ categories }: MobileSearchCardProps) {
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  return (
    <LocalizedTree>
      <section aria-label="البحث" className="mobile-home-search-card" data-search-anchor>
        <form action="/search" className="mobile-home-search-card__panel">
          <div className="mobile-home-search-card__input-row">
            <span className="sr-only">{HOME_SEARCH_LABELS.query}</span>
            <SearchTypeahead
              bare
              className="mobile-home-search-card__typeahead min-w-0 flex-1"
              inputClassName="mobile-home-search-card__input"
              inputId={SMART_SEARCH_INPUT_ID}
              label=""
              name="q"
              placeholder=""
              selectedFilters={{ category, city }}
            />
            <Icon className="mobile-home-search-card__search-icon" name="search" size={16} />
          </div>

          <div className="mobile-home-search-card__filters">
            <div className="mobile-home-search-card__filter-row">
              <label className="mobile-home-search-card__segment">
                <span className="mobile-home-search-card__segment-label">
                  {HOME_SEARCH_LABELS.category}
                </span>
                <span className="mobile-home-search-card__segment-control">
                  <Icon
                    aria-hidden
                    className="mobile-home-search-card__segment-icon"
                    name="grid"
                    size={11}
                  />
                  <select
                    className="mobile-home-search-card__select"
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

              <label className="mobile-home-search-card__segment">
                <span className="mobile-home-search-card__segment-label">
                  {HOME_SEARCH_LABELS.city}
                </span>
                <span className="mobile-home-search-card__segment-control">
                  <Icon
                    aria-hidden
                    className="mobile-home-search-card__segment-icon"
                    name="map"
                    size={11}
                  />
                  <select
                    className="mobile-home-search-card__select"
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
            </div>

            <div className="mobile-home-search-card__filter-row mobile-home-search-card__filter-row--action">
              <label className="mobile-home-search-card__segment">
                <span className="mobile-home-search-card__segment-label">
                  {HOME_SEARCH_LABELS.price}
                </span>
                <span className="mobile-home-search-card__segment-control">
                  <Icon
                    aria-hidden
                    className="mobile-home-search-card__segment-icon"
                    name="filter"
                    size={11}
                  />
                  <select className="mobile-home-search-card__select" defaultValue="" name="price">
                    {HOME_SEARCH_PRICE_OPTIONS.map((option) => (
                      <option key={option.value || "any"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              <button className="mobile-home-search-card__submit" type="submit">
                <Icon aria-hidden name="search" size={15} />
                <span>{HOME_SEARCH_LABELS.submit}</span>
              </button>
            </div>
          </div>
        </form>
      </section>
    </LocalizedTree>
  );
}
