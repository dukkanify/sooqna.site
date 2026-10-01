import { Copy } from "@/shared/i18n/LocalizedTree";
import { Icon } from "@/shared/ui/Icon";

type FeaturedBadgeProps = {
  className?: string;
  /** `sm` for cards; `md` for listing detail / gallery. */
  size?: "sm" | "md";
  /** Stronger contrast when overlaid on photos. */
  onMedia?: boolean;
};

/**
 * Brand Featured marker — espresso seal, gold accent bar, luminous star.
 */
export function FeaturedBadge({
  className = "",
  size = "sm",
  onMedia = false,
}: FeaturedBadgeProps) {
  const sizeClass =
    size === "md"
      ? "listing-featured-badge--md gap-1.5 px-3 py-1.5 text-[0.8125rem]"
      : "listing-featured-badge--sm gap-1 px-2.5 py-1 text-[0.7rem] sm:text-xs";

  return (
    <span
      className={`listing-featured-badge ${sizeClass} ${
        onMedia ? "listing-featured-badge--media" : ""
      } ${className}`.trim()}
      title="إعلان مميّز — باقة التمييز"
    >
      <span aria-hidden className="listing-featured-badge__sheen" />
      <Icon
        className="listing-featured-badge__star shrink-0"
        name="star"
        size={size === "md" ? 14 : 12}
      />
      <Copy text="مميّز" />
    </span>
  );
}
