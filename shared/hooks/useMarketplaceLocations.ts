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
 * Network refresh is idle-deferred so hero LCP is not contested.
 */
export function useMarketplaceLocations(): City[] {
  const [locations, setLocations] = useState<City[]>(fallbackCities);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (cancelled) return;
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
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(load, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(load, 200);
    }

    return () => {
      cancelled = true;
      if (idleId != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, []);

  return locations;
}
