import type { Category, CategoryIconName } from "@/types";
import { CategoryGlyph } from "@/shared/components/CategoryGlyph";

type CategoryMarkProps = {
  category?: Pick<Category, "id" | "icon" | "name" | "imageUrl">;
  className?: string;
  iconSize?: number;
  selected?: boolean;
  variant?: "category" | "more";
};

/**
 * Elegant Sooqna category mark: navy circle + gold silhouette.
 * Matches the premium circular gold-on-navy icon language.
 */
export function CategoryMark({
  category,
  className = "",
  iconSize = 28,
  selected = false,
  variant = "category",
}: CategoryMarkProps) {
  const iconName: CategoryIconName | "grid" =
    variant === "more" ? "grid" : (category?.icon ?? "grid");

  return (
    <span
      aria-hidden
      className={`category-mark ${selected ? "category-mark--selected" : ""} ${
        variant === "more" ? "category-mark--more" : ""
      } ${className}`.trim()}
    >
      <span className="category-mark__glow" />
      <CategoryGlyph className="category-mark__glyph" name={iconName} size={iconSize} />
    </span>
  );
}
