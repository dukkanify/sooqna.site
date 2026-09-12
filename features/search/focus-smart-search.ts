/** Shared focus target for every home search entry point (header, quick bar, hero). */
export const SMART_SEARCH_INPUT_ID = "sooqna-smart-search-input";

export const SMART_SEARCH_FOCUS_EVENT = "sooqna:focus-smart-search";

/** Scroll to the hero search card and focus the smart typeahead input. */
export function focusSmartSearch(): void {
  if (typeof document === "undefined") return;

  const anchor = document.querySelector<HTMLElement>("[data-search-anchor]");
  const input = document.getElementById(
    SMART_SEARCH_INPUT_ID,
  ) as HTMLInputElement | null;

  if (anchor) {
    anchor.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  window.dispatchEvent(new Event(SMART_SEARCH_FOCUS_EVENT));

  window.setTimeout(() => {
    input?.focus({ preventScroll: true });
    input?.select?.();
  }, 280);
}
