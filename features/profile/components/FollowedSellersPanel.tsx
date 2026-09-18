"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FollowSellerButton } from "@/features/listings/components/FollowSellerButton";
import { AppImage } from "@/shared/components/AppImage";
import { STORAGE_EVENTS } from "@/shared/constants/brand";
import { listingCountLabel } from "@/shared/i18n/count-labels";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useLocale } from "@/shared/i18n/useLocale";
import { intlLocale } from "@/shared/i18n/locale";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

type FollowedSeller = {
  id: string;
  name: string;
  nameEnglish?: string;
  avatarUrl?: string;
  isVerified: boolean;
  listingCount: number;
  followedAt: string;
  responseTime?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ب";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export function FollowedSellersPanel() {
  const locale = useLocale();
  const [sellers, setSellers] = useState<FollowedSeller[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback((signal?: AbortSignal) => {
    fetch("/api/follows", { credentials: "include", signal })
      .then((res) => {
        if (!res.ok) throw new Error("FOLLOW_LIST_FAILED");
        return res.json() as Promise<{ sellers: FollowedSeller[] }>;
      })
      .then((data) => {
        setSellers(Array.isArray(data.sellers) ? data.sellers : []);
        setError(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(true);
        setSellers([]);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const sync = () => load();
    window.addEventListener(STORAGE_EVENTS.followsChange, sync);
    return () => {
      controller.abort();
      window.removeEventListener(STORAGE_EVENTS.followsChange, sync);
    };
  }, [load]);

  if (sellers === null) {
    return (
      <p className="text-xs text-muted" role="status">
        جاري تحميل البائعين…
      </p>
    );
  }

  if (error) {
    return (
      <EmptyState
        description="تعذر تحميل قائمة المتابعة. حاول مرة أخرى لاحقاً."
        icon="package"
        title="تعذر التحميل"
      />
    );
  }

  if (sellers.length === 0) {
    return (
      <EmptyState
        actionHref="/search"
        actionLabel="تصفح الإعلانات"
        description="من صفحة أي إعلان اضغط «متابعة البائع» — ستظهر القائمة هنا، وستصلك إشعارات عند إعلاناتهم الجديدة."
        icon="package"
        title="لا تتابع أي بائع بعد"
      />
    );
  }

  return (
    <LocalizedTree>
      <ul className="grid gap-3">
        {sellers.map((seller) => {
          const displayName =
            locale === "en" && seller.nameEnglish
              ? seller.nameEnglish
              : seller.name;
          return (
            <li
              key={seller.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-border bg-surface-muted px-4 py-3"
            >
              <Link
                className="flex min-w-0 flex-1 items-center gap-3"
                href={`/sellers/${encodeURIComponent(seller.id)}`}
              >
                <span
                  aria-hidden
                  className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-sm font-bold text-surface"
                >
                  {seller.avatarUrl ? (
                    <AppImage
                      alt=""
                      className="object-cover"
                      fallback="avatar"
                      fill
                      sizes="40px"
                      src={seller.avatarUrl}
                    />
                  ) : (
                    initials(displayName)
                  )}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="truncate text-sm font-semibold text-ink"
                      data-ugc
                    >
                      {displayName}
                    </span>
                    {seller.isVerified ? (
                      <Icon
                        className="shrink-0 text-accent"
                        name="shield"
                        size={14}
                      />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {listingCountLabel(seller.listingCount, locale)}
                    {" · "}
                    {new Date(seller.followedAt).toLocaleDateString(
                      intlLocale(locale),
                    )}
                  </span>
                </span>
              </Link>
              <FollowSellerButton className="shrink-0" sellerId={seller.id} />
            </li>
          );
        })}
      </ul>
    </LocalizedTree>
  );
}
