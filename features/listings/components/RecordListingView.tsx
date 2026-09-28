"use client";

import { useEffect, useRef } from "react";

type RecordListingViewProps = {
  listingId: string;
  /** Skip owner preview / non-public pages. */
  enabled?: boolean;
};

const SESSION_PREFIX = "sooqna-listing-view:";

/**
 * Counts one real visit per browser session for a public listing page.
 * Client: sessionStorage dedupe. Server: httpOnly cookie + IP window +
 * automated UA rejection (see /api/listings/view).
 */
export function RecordListingView({
  listingId,
  enabled = true,
}: RecordListingViewProps) {
  const sent = useRef(false);

  useEffect(() => {
    if (!enabled || !listingId || sent.current) return;
    if (typeof window === "undefined") return;

    const key = `${SESSION_PREFIX}${listingId}`;
    try {
      if (window.sessionStorage.getItem(key) === "1") return;
    } catch {
      /* private mode — still count once via ref */
    }

    sent.current = true;
    void fetch("/api/listings/view", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
      keepalive: true,
    })
      .then(async (response) => {
        if (!response.ok) return;
        try {
          window.sessionStorage.setItem(key, "1");
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        sent.current = false;
      });
  }, [enabled, listingId]);

  return null;
}
