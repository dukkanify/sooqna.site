import type { CSSProperties } from "react";
import type { Category, CategoryIconName } from "@/types";
import { AppImage } from "@/shared/components/AppImage";
import { CategoryGlyph } from "@/shared/components/CategoryGlyph";

type CategoryTone = {
  /** Accent wash used when no photo / for the icon badge */
  accent: string;
  /** Glyph color on the badge */
  ink: string;
};

/** Bold brand accents — navy plates; bright ink for max glyph clarity. */
const CATEGORY_TONES: Record<string, CategoryTone> = {
  cars: { accent: "linear-gradient(145deg, #0b1628 0%, #1a2f4d 100%)", ink: "#ffffff" },
  electronics: { accent: "linear-gradient(145deg, #152238 0%, #243a58 100%)", ink: "#ffffff" },
  jobs: { accent: "linear-gradient(145deg, #1a2438 0%, #2a3a52 100%)", ink: "#ffffff" },
  furniture: { accent: "linear-gradient(145deg, #2a2418 0%, #3d3424 100%)", ink: "#ffffff" },
  fashion: { accent: "linear-gradient(145deg, #0b1628 0%, #2a2418 100%)", ink: "#ffffff" },
  mobiles: { accent: "linear-gradient(145deg, #121c2e 0%, #1e2d48 100%)", ink: "#ffffff" },
  "real-estate": { accent: "linear-gradient(145deg, #143528 0%, #1e4a38 100%)", ink: "#ffffff" },
  services: { accent: "linear-gradient(145deg, #1c1810 0%, #3a3020 100%)", ink: "#ffffff" },
  pets: { accent: "linear-gradient(145deg, #2a2418 0%, #1a2438 100%)", ink: "#ffffff" },
  sports: { accent: "linear-gradient(145deg, #152238 0%, #1a3a2e 100%)", ink: "#ffffff" },
};

const DEFAULT_TONE: CategoryTone = {
  accent: "linear-gradient(145deg, #0b1628 0%, #1c2d48 100%)",
  ink: "#ffffff",
};

const MORE_TONE: CategoryTone = {
  accent: "linear-gradient(145deg, #060d18 0%, #0b1628 45%, #1a2a44 100%)",
  ink: "#ffe6a8",
};

type CategoryMarkProps = {
  category?: Pick<Category, "id" | "icon" | "name" | "imageUrl">;
  className?: string;
  /** Pixel size of the glyph */
  iconSize?: number;
  selected?: boolean;
  variant?: "category" | "more";
};

/**
 * Strong marketplace category tile:
 * full-bleed photo + heavy navy scrim + large filled glyph badge.
 */
export function CategoryMark({
  category,
  className = "",
  iconSize = 28,
  selected = false,
  variant = "category",
}: CategoryMarkProps) {
  const isMore = variant === "more";
  const tone = isMore
    ? MORE_TONE
    : category
      ? (CATEGORY_TONES[category.id] ?? DEFAULT_TONE)
      : DEFAULT_TONE;

  const iconName: CategoryIconName | "grid" = isMore
    ? "grid"
    : (category?.icon ?? "grid");

  // Always use photo mode for categories — AppImage falls back by category id
  // when imageUrl is missing from the store payload.
  const hasPhoto = !isMore && Boolean(category?.id);

  return (
    <span
      aria-hidden
      className={`category-mark ${hasPhoto ? "category-mark--photo" : "category-mark--solid"} ${
        selected ? "category-mark--selected" : ""
      } ${isMore ? "category-mark--more" : ""} ${className}`.trim()}
      style={
        {
          "--category-mark-accent": tone.accent,
          "--category-mark-ink": tone.ink,
        } as CSSProperties
      }
    >
      {hasPhoto && category ? (
        <AppImage
          alt=""
          aria-hidden
          className="category-mark__photo"
          fallbackCategory={category.id}
          fill
          sizes="96px"
          src={category.imageUrl}
        />
      ) : null}

      <span className="category-mark__scrim" />
      <span className="category-mark__shine" />

      <span className="category-mark__badge">
        <CategoryGlyph className="category-mark__glyph" name={iconName} size={iconSize} />
      </span>
    </span>
  );
}
