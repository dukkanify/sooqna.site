import type { CategoryIconName } from "@/types";

type GlyphName = CategoryIconName | "grid";

type CategoryGlyphProps = {
  className?: string;
  name: GlyphName;
  size?: number;
};

/**
 * Filled silhouette glyphs — heavier than stroke icons so category tiles
 * read as strong marketplace marks, not thin UI chrome.
 */
const FILLED: Record<GlyphName, string> = {
  car: "M5.2 15.8H3.4l.2-1.1 1.5-4.2A2.2 2.2 0 0 1 7.2 9h9.6a2.2 2.2 0 0 1 2.1 1.5l1.5 4.2.2 1.1h-1.8v.4a1.4 1.4 0 1 1-2.8 0v-.4H8v.4a1.4 1.4 0 1 1-2.8 0v-.4Zm2.4-5.3.9-1.5h7l.9 1.5H7.6Z",
  home: "M12 2.6 2.8 10.2a1 1 0 0 0-.3.7V20a1.4 1.4 0 0 0 1.4 1.4h5.2v-6.2h6.2V21.4h5.2A1.4 1.4 0 0 0 21.9 20v-9.1a1 1 0 0 0-.3-.7L12 2.6Z",
  laptop:
    "M4.2 5.2A1.8 1.8 0 0 1 6 3.4h12a1.8 1.8 0 0 1 1.8 1.8v8.4H4.2V5.2ZM2.4 15.8h19.2v1.2A1.8 1.8 0 0 1 19.8 18.8H4.2A1.8 1.8 0 0 1 2.4 17V15.8Z",
  phone:
    "M8.2 2.4h7.6A2.2 2.2 0 0 1 18 4.6v14.8a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 19.4V4.6A2.2 2.2 0 0 1 8.2 2.4Zm3.8 15.6a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z",
  sofa: "M5.2 8.2A2 2 0 0 1 7.2 6.2h1V5.4A1.4 1.4 0 0 1 9.6 4h4.8A1.4 1.4 0 0 1 15.8 5.4v.8h1A2 2 0 0 1 18.8 8.2v2.6h1.4A1.6 1.6 0 0 1 21.8 12.4v3A1.8 1.8 0 0 1 20 17.2H4A1.8 1.8 0 0 1 2.2 15.4v-3A1.6 1.6 0 0 1 3.8 10.8h1.4V8.2Z",
  briefcase:
    "M9 4.2h6A1.8 1.8 0 0 1 16.8 6v1.2H19a2 2 0 0 1 2 2v9.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.2a2 2 0 0 1 2-2h2.2V6A1.8 1.8 0 0 1 9 4.2Zm1.4 1.8v1.2h3.2V6H10.4Zm1.6 6.2v2.8h.2v-2.8h-.2Z",
  watch:
    "M9.2 2.2h5.6v3.4H9.2V2.2Zm0 16.2h5.6v3.4H9.2v-3.4ZM12 6.4a5.6 5.6 0 1 1 0 11.2 5.6 5.6 0 0 1 0-11.2Zm0 2.2a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Zm.2 1.2v2.1l1.6.9-.4.8-2-.1V9.8h.8Z",
  paw: "M8.2 8.6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm7.6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5.4 13.2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm13.2 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 20.6c3.4 0 6-2.4 6-5.4S15.4 11 12 11s-6 1.8-6 4.2 2.6 5.4 6 5.4Z",
  wrench:
    "M14.9 3.4a4.6 4.6 0 0 0-6.2 6.2L3.2 15.1l.9.9 2.1-.2 1.8 1.8-.2 2.1.9.9 5.5-5.5a4.6 4.6 0 0 0 6.2-6.2l-2.6 2.6-2.5-2.5 2.6-2.6Z",
  baby: "M12 2.8a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8ZM6.2 13.2a5.8 5.8 0 0 0 11.6 0V15H6.2v-1.8Z",
  book: "M4.4 3.4h9.2A2.2 2.2 0 0 1 15.8 5.6v14.2H6.6A2.2 2.2 0 0 1 4.4 17.6V3.4Zm12 2.2h3.2v14.2h-3.2V5.6Z",
  sport:
    "M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm0 2.4 2.8 5H9.2L12 4.6Zm-6.4 6.4h6.2L12 16.2 9.6 11Zm0 7.6 3.1-5.4 3.1 5.4H5.6Zm12.8 0h-6.2l3.1-5.4 3.1 5.4Z",
  food: "M4.2 2.6v8.2a4.4 4.4 0 0 0 8.8 0V2.6H11v8.2a2.2 2.2 0 1 1-4.4 0V2.6H4.2Zm7.6 9.8v9H14v-9h-2.2Zm5.4-5.2V2.6h-2.2v4.6a3.4 3.4 0 1 0 6.8 0h-2.2a1.2 1.2 0 1 1-2.4 0Z",
  grid: "M3.4 3.4h7.2v7.2H3.4V3.4Zm10 0h7.2v7.2h-7.2V3.4ZM3.4 13.4h7.2v7.2H3.4v-7.2Zm10 0h7.2v7.2h-7.2v-7.2Z",
};

export function CategoryGlyph({
  className = "",
  name,
  size = 28,
}: CategoryGlyphProps) {
  const d = FILLED[name] ?? FILLED.grid;

  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={d} />
    </svg>
  );
}
