import { Copy } from "@/shared/i18n/LocalizedTree";
import { Icon } from "@/shared/ui/Icon";

type FeaturedBadgeProps = {
  className?: string;
  /** `sm` for cards; `md` for listing detail / gallery. */
  size?: "sm" | "md";
  /** Stronger contrast when overlaid on photos. */
  onMedia?: boolean;
  /** Diagonal luxury sash in the media corner (cards). */
  corner?: boolean;
};

/**
 * Brand Featured marker — metallic gold sash (corner) or compact ribbon.
 */
export function FeaturedBadge({
  className = "",
  size = "sm",
  onMedia = false,
  corner = false,
}: FeaturedBadgeProps) {
  const sizeClass = corner
    ? "listing-featured-badge--corner"
    : size === "md"
      ? "listing-featured-badge--md gap-1.5 px-3 py-1.5 text-[0.8125rem]"
      : "listing-featured-badge--sm gap-1 px-2.5 py-1 text-[0.7rem] sm:text-xs";

  return (
    <span
      className={`listing-featured-badge ${sizeClass} ${
        onMedia && !corner ? "listing-featured-badge--media" : ""
      } ${className}`.trim()}
      title="إعلان مميّز — باقة التمييز"
    >
      <span aria-hidden className="listing-featured-badge__sheen" />
      <Icon
        className="listing-featured-badge__star shrink-0"
        name="star"
        size={corner ? 11 : size === "md" ? 15 : 12}
      />
      <span className="listing-featured-badge__label">
        <Copy text="مميّز" />
      </span>
    </span>
  );
}
