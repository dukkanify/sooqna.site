"use client";

import { useEffect, useState } from "react";
import { cities as fallbackCities } from "@/shared/constants/locations";
import type { City } from "@/types";

type ApiLocation = {
  id: string;
  name: string;
  emirate?: string;
  sortOrder?: number;
};

/**
 * Live marketplace locations from admin-managed store, with static UAE
 * emirates as an immediate fallback so UI never blanks.
 */
export function useMarketplaceLocations(): City[] {
  const [locations, setLocations] = useState<City[]>(fallbackCities);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/locations")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.locations) || data.locations.length === 0) {
          return;
        }
        const next = (data.locations as ApiLocation[]).map((loc) => ({
          id: loc.id,
          name: loc.name,
        }));
        setLocations(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return locations;
}
