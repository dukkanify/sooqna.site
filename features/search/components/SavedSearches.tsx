"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getSavedSearches,
  removeSavedSearch,
  saveCurrentSearch,
  type SavedSearch,
} from "@/services/storage";
import { STORAGE_EVENTS } from "@/shared/constants/brand";
import { FormMessage } from "@/shared/ui/FormMessage";
import { Icon } from "@/shared/ui/Icon";

type SavedSearchesProps = {
  currentUrl: string;
  currentLabel: string;
};

export function SavedSearches({ currentLabel, currentUrl }: SavedSearchesProps) {
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(getSavedSearches());
    sync();
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
    setMessage(result.alreadySaved ? "هذا البحث محفوظ مسبقاً." : "تم حفظ البحث.");
    window.setTimeout(() => setMessage(""), 3000);
  }

  function handleRemove(id: string) {
    setSaved(removeSavedSearch(id));
  }

  return (
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
          {saved.length.toLocaleString("ar-AE")} محفوظ
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
  );
}
