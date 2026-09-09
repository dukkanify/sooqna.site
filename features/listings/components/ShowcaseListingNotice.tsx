"use client";

import type { Listing } from "@/types";
import { isShowcaseListing } from "@/shared/listings/showcase-listing";
import { LocalizedTree } from "@/shared/i18n/LocalizedTree";
import { Card } from "@/shared/ui/Card";
import { Icon } from "@/shared/ui/Icon";

export function ShowcaseListingNotice({ listing }: { listing: Listing }) {
  if (!isShowcaseListing(listing)) return null;

  return (
    <LocalizedTree>
      <Card className="marketplace-panel w-full min-w-0 border-slate-300 bg-slate-50 p-6">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-[var(--radius-xl)] bg-slate-200 text-slate-700">
            <Icon name="message" size={18} />
          </span>
          <h2 className="text-base font-black text-ink">إعلان تجريبي</h2>
        </div>
        <p className="mt-4 text-sm font-medium leading-7 text-muted">
          هذا إعلان من معرض سوقنا لتوضيح تجربة المنصة. ليس إعلاناً مقدّماً من بائع
          مستقل، ولا يمثل تقييماً أو مبيعات أو مشاهدات حقيقية.
        </p>
      </Card>
    </LocalizedTree>
  );
}
