import { Copy } from "@/shared/i18n/LocalizedTree";
import { Icon } from "@/shared/ui/Icon";

type FeaturedBadgeProps = {
  className?: string;
  /** `sm` for chips; `md` for listing detail / gallery. */
  size?: "sm" | "md";
  /** Stronger contrast when overlaid on photos. */
  onMedia?: boolean;
  /**
   * `cap` — elegant bar sitting above the listing card (not on the photo).
   * `chip` — compact inline mark for gallery / sticky panels.
   */
  placement?: "cap" | "chip";
};

/**
 * Brand Featured marker — above-card gold cap, or compact chip off-photo.
 */
export function FeaturedBadge({
  className = "",
  size = "sm",
  onMedia = false,
  placement = "chip",
}: FeaturedBadgeProps) {
  if (placement === "cap") {
    return (
      <span
        className={`listing-featured-badge listing-featured-badge--cap ${className}`.trim()}
        title="إعلان مميّز — باقة التمييز"
      >
        <span aria-hidden className="listing-featured-badge__sheen" />
        <Icon
          className="listing-featured-badge__star shrink-0"
          name="star"
          size={12}
        />
        <span className="listing-featured-badge__label">
          <Copy text="مميّز" />
        </span>
      </span>
    );
  }

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
        size={size === "md" ? 15 : 12}
      />
      <span className="listing-featured-badge__label">
        <Copy text="مميّز" />
      </span>
    </span>
  );
}
