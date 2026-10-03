"use client";

import Link from "next/link";
import { useFavoritesList, FavoriteButton } from "@/shared/components/FavoriteButton";
import { CurrencyAmount } from "@/shared/components/CurrencyAmount";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import type { Listing } from "@/types";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { useLocale } from "@/shared/i18n/useLocale";
import { intlLocale } from "@/shared/i18n/locale";
import { humanDisplayLabel } from "@/shared/display/technical-id";
import { listingDetailsHref } from "@/shared/listings/listing-url";

function getFavoriteHref(item: { listingId: string; slug: string }) {
  return (
    listingDetailsHref({ id: item.listingId, slug: item.slug }) ??
    "/search"
  );
}

export function FavoritesPanel() {
  const favorites = useFavoritesList();
  const locale = useLocale();

  if (favorites.length === 0) {
    return (
      <EmptyState
        actionHref="/search"
        actionLabel="تصفح الإعلانات"
        description="احفظ الإعلانات التي تهمك للوصول إليها بسرعة."
        icon="package"
        title="لا توجد مفضلات بعد"
      />
    );
  }

  return (
    <LocalizedTree>
    <ul className="grid gap-3">
      {favorites.map((item) => (
        <li key={item.listingId}>
          <Card className="flex items-center justify-between gap-3 p-4" variant="flat">
            <Link className="min-w-0 flex-1" href={getFavoriteHref(item)}>
              <p className="truncate font-semibold text-ink" data-ugc>
                {humanDisplayLabel(item.title, "إعلان")}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {new Date(item.savedAt).toLocaleDateString(intlLocale(locale))}
              </p>
            </Link>
            <div className="flex items-center gap-2">
              <CurrencyAmount amount={item.price} size="sm" />
              <FavoriteButton
                className="!min-h-9 !min-w-9 !px-2"
                iconOnly
                listing={
                  {
                    id: item.listingId,
                    slug: item.slug,
                    title: item.title,
                    price: item.price,
                    imageUrl: item.imageUrl,
                  } as Listing
                }
              />
            </div>
          </Card>
        </li>
      ))}
    </ul>
    </LocalizedTree>
  );
}
