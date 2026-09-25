"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getSavedSearches,
  removeSavedSearch,
  replaceSavedSearches,
  type SavedSearch,
} from "@/services/storage";
import { STORAGE_EVENTS } from "@/shared/constants/brand";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

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

export function ProfileSavedSearches() {
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(getSavedSearches());
    sync();
    void hydrateFromServer().then((items) => {
      if (items) setSaved(items);
      setReady(true);
    });
    window.addEventListener(STORAGE_EVENTS.savedSearchesChange, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORAGE_EVENTS.savedSearchesChange, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (ready && saved.length === 0) {
    return (
      <EmptyState
        actionHref="/search"
        actionLabel="ابحث في السوق"
        description="من نتائج البحث اضغط «حفظ البحث» — القائمة تظهر هنا وفي صفحة البحث."
        icon="search"
        title="لا توجد عمليات بحث محفوظة"
      />
    );
  }

  if (!ready && saved.length === 0) {
    return (
      <p className="text-sm font-medium text-muted">جاري تحميل عمليات البحث المحفوظة…</p>
    );
  }

  return (
    <ul className="grid gap-2">
      {saved.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-2 rounded-[var(--radius-xl)] border border-border bg-surface-muted px-4 py-3"
        >
          <Link className="min-w-0 flex-1 truncate text-sm font-semibold text-ink" href={item.url}>
            {item.label}
          </Link>
          <button
            aria-label={`حذف ${item.label}`}
            className="focus-ring grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-error"
            onClick={() => {
              setSaved(removeSavedSearch(item.id));
              void fetch(`/api/saved-searches?id=${encodeURIComponent(item.id)}`, {
                method: "DELETE",
                credentials: "include",
              }).catch(() => undefined);
            }}
            type="button"
          >
            <Icon name="close" size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
