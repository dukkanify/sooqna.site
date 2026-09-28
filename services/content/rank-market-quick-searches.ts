import type { MarketQuickSearch } from "@/services/content/homepage-marketplace.content";
import { sortByPopularity } from "@/services/search/search-popularity";
import { getMergedPopularityScores } from "@/services/search/search-popularity-store";

/** Server-only ranking for hero pills (keeps durability imports off the client). */
export async function rankMarketQuickSearches(
  searches: MarketQuickSearch[],
): Promise<MarketQuickSearch[]> {
  try {
    const scores = await getMergedPopularityScores();
    return sortByPopularity(searches, (item) => item.key, scores, "pill");
  } catch {
    return searches;
  }
}
