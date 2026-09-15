import type { CategoryIconName } from "@/types";

type GlyphName = CategoryIconName | "grid";

type CategoryGlyphProps = {
  className?: string;
  name: GlyphName;
  size?: number;
};

/**
 * Sharp gold silhouettes for navy circular marks.
 * Shapes are simplified and chunky so they stay crisp at ~28–36px.
 */
const FILLED: Record<GlyphName, string> = {
  // Front car — windshield + body + wheels (matches reference)
  car: "M7.2 10.2 8.4 7.6A1.6 1.6 0 0 1 9.9 6.6h4.2a1.6 1.6 0 0 1 1.5 1l1.2 2.6H18V13h-1.2a2.1 2.1 0 0 1-4.1 0h-1.4a2.1 2.1 0 0 1-4.1 0H6.2v-2.8h1Zm1.6-1.6.5-1.2h5.4l.5 1.2H8.8ZM8.2 13.6a1.05 1.05 0 1 0 0-2.1 1.05 1.05 0 0 0 0 2.1Zm7.6 0a1.05 1.05 0 1 0 0-2.1 1.05 1.05 0 0 0 0 2.1Z",
  home: "M12 3.4 4 10.4h2.2V20h4.8v-5.2h2V20H18v-9.6H20.2L12 3.4Z",
  laptop:
    "M4.2 5.6A1.4 1.4 0 0 1 5.6 4.2h12.8A1.4 1.4 0 0 1 19.8 5.6V14H4.2V5.6ZM2.6 15.8h18.8v1.1A1.5 1.5 0 0 1 19.9 18.4H4.1A1.5 1.5 0 0 1 2.6 16.9v-1.1Z",
  phone:
    "M8.2 2.6h7.6A1.8 1.8 0 0 1 17.6 4.4v15.2a1.8 1.8 0 0 1-1.8 1.8H8.2a1.8 1.8 0 0 1-1.8-1.8V4.4A1.8 1.8 0 0 1 8.2 2.6Zm3.8 15.4a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z",
  // Armchair — matches reference furniture glyph
  sofa: "M8.2 10.2V8.2A2.2 2.2 0 0 1 10.4 6h3.2a2.2 2.2 0 0 1 2.2 2.2v2H17a1.6 1.6 0 0 1 1.6 1.6v3.8H5.4v-3.8A1.6 1.6 0 0 1 7 10.2h1.2ZM6.2 17.4h2.2v-1.1h7.2v1.1h2.2V16H6.2v1.4Z",
  briefcase:
    "M9 4.8h6A1.4 1.4 0 0 1 16.4 6.2v1H18.5A1.5 1.5 0 0 1 20 8.7v9.1A1.5 1.5 0 0 1 18.5 19.3H5.5A1.5 1.5 0 0 1 4 17.8V8.7A1.5 1.5 0 0 1 5.5 7.2H7.6v-1A1.4 1.4 0 0 1 9 4.8Zm1.3 1.4v1h3.4v-1h-3.4Zm1.5 5.6v2.2h.4v-2.2h-.4Z",
  watch:
    "M9.5 2.5h5v2.6h-5V2.5Zm0 16.4h5v2.6h-5v-2.6ZM12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 1.8a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Zm.4 1.1v2.3l1.6.95-.45.85-2.05-1.2V9.4h.9Z",
  paw: "M8.2 8.2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm7.6 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5.6 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12.8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 20.4c3.2 0 5.8-2.2 5.8-5S15.2 11.4 12 11.4 6.2 13.2 6.2 15.4s2.6 5 5.8 5Z",
  wrench:
    "M14.9 3.5a4.5 4.5 0 0 0-6.1 6.1L3.4 15l.9.9 2-.2 1.7 1.7-.2 2 .9.9 5.4-5.4a4.5 4.5 0 0 0 6.1-6.1l-2.5 2.5-2.4-2.4 2.5-2.5Z",
  baby: "M12 2.9a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6ZM6.4 13.5a5.6 5.6 0 0 0 11.2 0V15H6.4v-1.5Z",
  book: "M4.5 3.7h9A1.7 1.7 0 0 1 15.2 5.4v13.8H6.4A1.9 1.9 0 0 1 4.5 17.3V3.7Zm11.3 1.9h3.1v13.8h-3.1V5.6Z",
  sport:
    "M12 2.3a9.7 9.7 0 1 0 0 19.4 9.7 9.7 0 0 0 0-19.4Zm0 2.5 2.7 4.9H9.3L12 4.8ZM5.8 11.2h6L12 16.8l-2.7-5.6H5.8Zm0 7.6 3-5.3 3 5.3H5.8Zm12.4 0h-6l3-5.3 3 5.3Z",
  food: "M4.3 2.9v8a4.3 4.3 0 0 0 8.6 0v-8H11v8a2.1 2.1 0 1 1-4.2 0v-8H4.3Zm7.6 9.9v8.2H14v-8.2h-2.1Zm5.3-5.1V2.9h-2.1v4.5a3.3 3.3 0 1 0 6.6 0h-2.1a1.2 1.2 0 1 1-2.4 0Z",
  grid: "M3.5 3.5h7v7h-7v-7Zm10 0h7v7h-7v-7ZM3.5 13.5h7v7h-7v-7Zm10 0h7v7h-7v-7Z",
};

export function CategoryGlyph({
  className = "",
  name,
  size = 30,
}: CategoryGlyphProps) {
  const d = FILLED[name] ?? FILLED.grid;

  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      height={size}
      shapeRendering="geometricPrecision"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d={d} />
    </svg>
  );
}
