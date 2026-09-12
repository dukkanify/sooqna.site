"use client";

import Link from "next/link";
import { Copy } from "@/shared/i18n/LocalizedTree";
import { useTx } from "@/shared/i18n/useTx";

type BreadcrumbItem = {
  href?: string;
  label: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const t = useTx();
  return (
    <nav
      aria-label={t("مسار التنقل")}
      className="mb-6 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 overflow-hidden text-sm font-medium text-muted"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span
            key={`${item.label}-${index}`}
            className={`inline-flex min-w-0 max-w-full items-center gap-2 ${isLast ? "basis-full sm:basis-auto" : ""}`}
          >
            {index > 0 ? (
              <span aria-hidden className="shrink-0 text-border">
                /
              </span>
            ) : null}
            {item.href && !isLast ? (
              <Link className="shrink-0 transition hover:text-ink" href={item.href}>
                <Copy text={item.label} />
              </Link>
            ) : (
              <span
                className={`min-w-0 ${isLast ? "truncate text-ink" : ""}`}
                title={isLast ? item.label : undefined}
              >
                <Copy text={item.label} />
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
