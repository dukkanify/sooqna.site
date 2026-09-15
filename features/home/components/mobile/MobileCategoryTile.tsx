import Link from "next/link";
import type { Category } from "@/types";
import { CategoryMark } from "@/shared/components/CategoryMark";

type MobileCategoryTileProps = {
  category?: Category;
  href: string;
  label: string;
  variant?: "category" | "more";
};

export function MobileCategoryTile({
  category,
  href,
  label,
  variant = "category",
}: MobileCategoryTileProps) {
  return (
    <Link className="mobile-home-categories__card" href={href}>
      <span className="mobile-home-categories__thumb">
        {variant === "more" ? (
          <CategoryMark iconSize={18} variant="more" />
        ) : category ? (
          <CategoryMark category={category} iconSize={20} />
        ) : null}
      </span>
      <span className="mobile-home-categories__label">{label}</span>
    </Link>
  );
}
