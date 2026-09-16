import Image from "next/image";
import type { Category, CategoryIconName } from "@/types";
import { getCategory3dIconSrc } from "@/shared/constants/category-3d-icons";
import { CategoryGlyph } from "@/shared/components/CategoryGlyph";

type CategoryMarkProps = {
  category?: Pick<Category, "id" | "icon" | "name" | "imageUrl">;
  className?: string;
  iconSize?: number;
  selected?: boolean;
  variant?: "category" | "more";
};

/**
 * Premium Sooqna category mark: artistic 3D icon tile (navy + gold).
 * Falls back to a silhouette glyph only if the asset map is missing a key.
 */
export function CategoryMark({
  category,
  className = "",
  iconSize = 36,
  selected = false,
  variant = "category",
}: CategoryMarkProps) {
  const iconName: CategoryIconName | "grid" =
    variant === "more" ? "grid" : (category?.icon ?? "grid");
  const src = getCategory3dIconSrc(iconName);

  return (
    <span
      aria-hidden
      className={`category-mark ${selected ? "category-mark--selected" : ""} ${
        variant === "more" ? "category-mark--more" : ""
      } ${className}`.trim()}
    >
      <span className="category-mark__glow" />
      {src ? (
        <Image
          alt=""
          className="category-mark__image"
          height={256}
          sizes="(max-width: 768px) 78px, 92px"
          src={src}
          width={256}
        />
      ) : (
        <CategoryGlyph className="category-mark__glyph" name={iconName} size={iconSize} />
      )}
    </span>
  );
}
