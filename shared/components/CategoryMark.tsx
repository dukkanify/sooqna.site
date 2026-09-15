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
 * Soft faces use a denser wash so marks read clearly on the light page.
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
    wash: "linear-gradient(160deg, #efe6d4 0%, #e4e9f2 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 48%)",
  },
  jobs: {
    face: "soft",
    wash: "linear-gradient(160deg, #e4e9f2 0%, #ebe4d8 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 42%)",
  },
  furniture: {
    face: "soft",
    wash: "linear-gradient(160deg, #f0e4cf 0%, #ebe6dc 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 50%)",
  },
  fashion: {
    face: "navy",
    wash: "linear-gradient(145deg, #122036 0%, #1a2a44 55%, #2a3f5c 100%)",
    ink: "#c9a962",
    ring: "rgb(201 169 98 / 50%)",
  },
  mobiles: {
    face: "soft",
    wash: "linear-gradient(160deg, #e2e7f0 0%, #dce2ec 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 44%)",
  },
  "real-estate": {
    face: "soft",
    wash: "linear-gradient(160deg, #dcebe3 0%, #e4e9f2 100%)",
    ink: "#0b1628",
    ring: "rgb(45 106 79 / 38%)",
  },
  services: {
    face: "soft",
    wash: "linear-gradient(160deg, #ebe4d8 0%, #f0e4cf 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 46%)",
  },
  pets: {
    face: "soft",
    wash: "linear-gradient(160deg, #f0e4cf 0%, #ebe6dc 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 48%)",
  },
  sports: {
    face: "soft",
    wash: "linear-gradient(160deg, #e4e9f2 0%, #ebe4d8 100%)",
    ink: "#0b1628",
    ring: "rgb(201 169 98 / 42%)",
  },
};

const DEFAULT_TONE: CategoryTone = {
  face: "soft",
  wash: "linear-gradient(160deg, #efe6d4 0%, #e4e9f2 100%)",
  ink: "#0b1628",
  ring: "rgb(201 169 98 / 44%)",
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
