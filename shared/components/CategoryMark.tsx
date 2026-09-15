import type { CSSProperties } from "react";
import type { Category, CategoryIconName } from "@/types";
import { Icon } from "@/shared/ui/Icon";

type CategoryTone = {
  /** Soft brand wash behind the glyph */
  wash: string;
  /** Icon / glyph color */
  ink: string;
  /** Accent ring (gold) */
  ring: string;
  /** Optional deeper face for hero categories */
  face?: "navy" | "soft";
};

/**
 * Brand-aligned tones — navy / gold / warm ivory only.
 * Avoids rainbow category chips so the grid reads as one Sooqna system.
 */
const CATEGORY_TONES: Record<string, CategoryTone> = {
  cars: {
    face: "navy",
    wash: "linear-gradient(145deg, #0b1628 0%, #1c2d48 58%, #243a58 100%)",
    ink: "#c9a962",
    ring: "rgb(201 169 98 / 55%)",
  },
  electronics: {
    face: "soft",
    wash: "linear-gradient(160deg, #f7f0e4 0%, #eef1f6 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 35%)",
  },
  jobs: {
    face: "soft",
    wash: "linear-gradient(160deg, #eef1f6 0%, #f3f0ea 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 30%)",
  },
  furniture: {
    face: "soft",
    wash: "linear-gradient(160deg, #f7f0e4 0%, #faf9f7 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 38%)",
  },
  fashion: {
    face: "soft",
    wash: "linear-gradient(145deg, #f7f0e4 0%, #efe4cf 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 45%)",
  },
  mobiles: {
    face: "soft",
    wash: "linear-gradient(160deg, #eef1f6 0%, #e8ecf3 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 32%)",
  },
  "real-estate": {
    face: "soft",
    wash: "linear-gradient(160deg, #e8f3ed 0%, #eef1f6 100%)",
    ink: "#0b1628",
    ring: "rgb(45 106 79 / 28%)",
  },
  services: {
    face: "soft",
    wash: "linear-gradient(160deg, #f3f0ea 0%, #f7f0e4 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 34%)",
  },
  pets: {
    face: "soft",
    wash: "linear-gradient(160deg, #f7f0e4 0%, #f3f0ea 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 36%)",
  },
  sports: {
    face: "soft",
    wash: "linear-gradient(160deg, #eef1f6 0%, #f3f0ea 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 30%)",
  },
};

const DEFAULT_TONE: CategoryTone = {
  face: "soft",
  wash: "linear-gradient(160deg, #f7f0e4 0%, #eef1f6 100%)",
  ink: "#0b1628",
  ring: "rgb(201 169 98 / 32%)",
};

const MORE_TONE: CategoryTone = {
  face: "navy",
  wash: "linear-gradient(145deg, #0b1628 0%, #243049 100%)",
  ink: "#c9a962",
  ring: "rgb(255 255 255 / 14%)",
};

type CategoryMarkProps = {
  category?: Pick<Category, "id" | "icon" | "name">;
  className?: string;
  /** Pixel size of the glyph inside the mark */
  iconSize?: number;
  selected?: boolean;
  /** "more" uses the navy/gold grid treatment */
  variant?: "category" | "more";
};

export function CategoryMark({
  category,
  className = "",
  iconSize = 28,
  selected = false,
  variant = "category",
}: CategoryMarkProps) {
  const tone =
    variant === "more"
      ? MORE_TONE
      : category
        ? (CATEGORY_TONES[category.id] ?? DEFAULT_TONE)
        : DEFAULT_TONE;

  const iconName: CategoryIconName | "grid" =
    variant === "more" ? "grid" : (category?.icon ?? "grid");

  return (
    <span
      aria-hidden
      className={`category-mark ${tone.face === "navy" ? "category-mark--navy" : "category-mark--soft"} ${
        selected ? "category-mark--selected" : ""
      } ${className}`.trim()}
      style={
        {
          "--category-mark-wash": tone.wash,
          "--category-mark-ink": tone.ink,
          "--category-mark-ring": tone.ring,
        } as CSSProperties
      }
    >
      <span className="category-mark__glow" />
      <Icon className="category-mark__icon" name={iconName} size={iconSize} />
    </span>
  );
}
