import type { ReactNode } from "react";
import Link from "next/link";

type MarketSectionHeaderProps = {
  actionHref?: string;
  actionLabel?: string;
  description?: string;
  eyebrow?: string;
  title: string;
};

export function MarketSectionHeader({
  actionHref,
  actionLabel = "عرض المزيد",
  description,
  eyebrow,
  title,
}: MarketSectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between md:mb-6">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-bold text-[#B8955F]">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-xl font-bold tracking-tight text-ink md:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-6 text-muted md:text-base md:leading-7">{description}</p>
        ) : null}
      </div>
      {actionHref ? (
        <Link
          className="shrink-0 text-sm font-bold text-[#B8955F] hover:text-[#9a7d4a]"
          href={actionHref}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function MarketSectionShell({
  children,
  variant = "sand",
}: {
  children: ReactNode;
  variant?: "sand" | "white";
}) {
  return (
    <section
      className={`py-8 md:py-10 ${variant === "sand" ? "bg-background" : "bg-surface"}`}
    >
      <div className="app-container">{children}</div>
    </section>
  );
}
