import type { Category } from "@/types";
import { CategoryMark } from "@/shared/components/CategoryMark";

type CategoryThumbnailProps = {
  category: Category;
  className?: string;
  selected?: boolean;
  variant?: "compact" | "default";
};

/** Branded category icon mark used on homepage, mobile grid, and add-listing. */
export function CategoryThumbnail({
  category,
  className = "",
  selected = false,
  variant = "default",
}: CategoryThumbnailProps) {
  const iconSize = variant === "compact" ? 22 : 26;

  return (
    <span
      className={`mobile-home-categories__thumb mx-auto ${
        variant === "compact" ? "add-listing-category-thumb" : ""
      } ${className}`.trim()}
    >
      <CategoryMark
        category={category}
        iconSize={iconSize}
        selected={selected}
      />
    </span>
  );
}
