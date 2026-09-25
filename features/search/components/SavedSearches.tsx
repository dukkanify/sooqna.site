"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getSavedSearches,
  removeSavedSearch,
  replaceSavedSearches,
  saveCurrentSearch,
  type SavedSearch,
} from "@/services/storage";
import { STORAGE_EVENTS } from "@/shared/constants/brand";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Icon } from "@/shared/ui/Icon";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { intlLocale } from "@/shared/i18n/locale";
import { useLocale } from "@/shared/i18n/useLocale";

type SavedSearchesProps = {
  currentUrl: string;
  currentLabel: string;
};

type ServerSavedSearch = {
  id: string;
  label: string;
  url: string;
};

async function hydrateFromServer(): Promise<SavedSearch[] | null> {
  try {
    const response = await fetch("/api/saved-searches", {
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { items?: ServerSavedSearch[] };
    const items = (payload.items ?? [])
      .filter((item) => item.id && item.label && item.url)
      .map((item) => ({
        id: item.id,
        label: item.label,
        url: item.url,
      }));
    return replaceSavedSearches(items);
  } catch {
    return null;
  }
}

export function SavedSearches({ currentLabel, currentUrl }: SavedSearchesProps) {
  const locale = useLocale();
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(getSavedSearches());
    sync();
    void hydrateFromServer().then((items) => {
      if (items) setSaved(items);
    });
    window.addEventListener(STORAGE_EVENTS.savedSearchesChange, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORAGE_EVENTS.savedSearchesChange, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function handleSave() {
    const result = saveCurrentSearch({ label: currentLabel, url: currentUrl });
    setSaved(result.items);
    setOpen(true);
    setMessage(
      result.alreadySaved
        ? "هذا البحث محفوظ مسبقاً."
        : "تم حفظ البحث — سنشعرّك عند ظهور إعلان مطابق.",
    );
    window.setTimeout(() => setMessage(""), 4000);

    // Sync to server so matching notifications can fire when new ads go live.
    try {
      const parsed = new URL(currentUrl, window.location.origin);
      void fetch("/api/saved-searches", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: currentLabel,
          url: currentUrl.startsWith("http")
            ? parsed.pathname + parsed.search
            : currentUrl,
          query: parsed.searchParams.get("q") || undefined,
          categoryId: parsed.searchParams.get("category") || undefined,
          city:
            parsed.searchParams.get("city") ||
            parsed.searchParams.get("emirate") ||
            undefined,
        }),
      })
        .then(async (response) => {
          if (!response.ok) return;
          const payload = (await response.json().catch(() => null)) as {
            item?: ServerSavedSearch;
          } | null;
          if (!payload?.item) return;
          await hydrateFromServer();
        })
        .catch(() => undefined);
    } catch {
      // ignore URL parse errors
    }
  }

  function handleRemove(id: string) {
    setSaved(removeSavedSearch(id));
    void fetch(`/api/saved-searches?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => undefined);
  }

  return (
    <LocalizedTree>
    <div className="relative">
      <button
        className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-bold text-ink hover:border-[#c9a45c]/50 hover:bg-secondary-soft"
        onClick={handleSave}
        type="button"
      >
        <Icon name="heart" size={14} />
        حفظ
      </button>
      {saved.length > 0 ? (
        <button
          className="ms-1 text-[11px] font-semibold text-primary"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {saved.length.toLocaleString(intlLocale(locale))} محفوظ
        </button>
      ) : null}

      {message ? (
        <div className="mt-2">
          <FormMessage variant="success">{message}</FormMessage>
        </div>
      ) : null}

      {open && saved.length > 0 ? (
        <ul className="mt-2 grid gap-1.5">
          {saved.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2"
            >
              <Link
                className="min-w-0 flex-1 truncate text-xs font-semibold text-ink transition hover:text-primary"
                href={item.url}
              >
                {item.label}
              </Link>
              <button
                aria-label={`حذف ${item.label}`}
                className="focus-ring grid size-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-muted hover:text-error"
                onClick={() => handleRemove(item.id)}
                type="button"
              >
                <Icon name="close" size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
    </LocalizedTree>
  );
}
