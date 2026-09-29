import type { Listing } from "@/types";

/** Highest real view counts first; newer posts break ties. */
export function sortByMostViewed<T extends Pick<Listing, "views" | "postedAt">>(
  listings: T[],
): T[] {
  return [...listings].sort((a, b) => {
    const viewsDelta = (b.views ?? 0) - (a.views ?? 0);
    if (viewsDelta !== 0) return viewsDelta;
    const aPosted = Date.parse(a.postedAt ?? "") || 0;
    const bPosted = Date.parse(b.postedAt ?? "") || 0;
    return bPosted - aPosted;
  });
}
