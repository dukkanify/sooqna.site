import type { CategoryIconName } from "@/types";

type GlyphName = CategoryIconName | "grid";

type CategoryGlyphProps = {
  className?: string;
  name: GlyphName;
  size?: number;
};

/**
 * Gold-on-navy marketplace silhouettes — simple, filled, instantly readable.
 * Shapes follow the Sooqna circular category language (car, laptop, sofa…).
 */
const FILLED: Record<GlyphName, string> = {
  car: "M5 11.8 6.6 7.4A1.6 1.6 0 0 1 8.1 6.4h7.8a1.6 1.6 0 0 1 1.5 1l1.6 4.4H21V17h-1.7a2.1 2.1 0 0 1-4.1 0H8.8a2.1 2.1 0 0 1-4.1 0H3v-5.2h2Zm2.4-2.6.7-1.7h8l.7 1.7H7.4ZM7.8 16.8a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3Zm8.4 0a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3Z",
  home: "M12 3 2.8 11h2.4v9.2h5.4v-5.6h5.2v5.6h5.4V11h2.4L12 3Z",
  laptop:
    "M4 5.2A1.6 1.6 0 0 1 5.6 3.6h12.8A1.6 1.6 0 0 1 20 5.2V14H4V5.2ZM2.4 16h19.2v1.2A1.8 1.8 0 0 1 19.8 19H4.2A1.8 1.8 0 0 1 2.4 17.2V16Z",
  phone:
    "M8 2.4h8A2 2 0 0 1 18 4.4v15.2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4.4A2 2 0 0 1 8 2.4Zm4 16.4a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3Z",
  sofa: "M8 10.2V8A2.4 2.4 0 0 1 10.4 5.6h3.2A2.4 2.4 0 0 1 16 8v2.2h1.8A1.8 1.8 0 0 1 19.6 12v4.2H4.4V12A1.8 1.8 0 0 1 6.2 10.2H8ZM5.2 18.2h3v-1.2h7.6v1.2h3V16.6H5.2v1.6Z",
  briefcase:
    "M9.2 4.6h5.6A1.4 1.4 0 0 1 16.2 6v1.1H18.6A1.6 1.6 0 0 1 20.2 8.7v9.2A1.6 1.6 0 0 1 18.6 19.5H5.4A1.6 1.6 0 0 1 3.8 17.9V8.7A1.6 1.6 0 0 1 5.4 7.1h2.4V6A1.4 1.4 0 0 1 9.2 4.6Zm1.2 1.4v1.1h3.2V6H10.4Zm1.4 5.8v2.4h.4v-2.4h-.4Z",
  watch:
    "M9.4 2.4h5.2v2.8H9.4V2.4Zm0 16.4h5.2v2.8H9.4v-2.8ZM12 6.4a5.6 5.6 0 1 1 0 11.2A5.6 5.6 0 0 1 12 6.4Zm0 1.9a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Zm.35 1.15v2.35l1.7 1-.5.9-2.15-1.25V9.5h.95Z",
  paw: "M8.1 8.4a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2Zm7.8 0a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2ZM5.4 13.2a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2Zm13.2 0a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2ZM12 20.6c3.4 0 6-2.3 6-5.2S15.4 11.2 12 11.2 6 13 6 15.4s2.6 5.2 6 5.2Z",
  wrench:
    "M15 3.4a4.6 4.6 0 0 0-6.2 6.2L3.2 15.2l.9.9 2.1-.2 1.8 1.8-.2 2.1.9.9 5.6-5.6a4.6 4.6 0 0 0 6.2-6.2l-2.6 2.6-2.5-2.5 2.6-2.6Z",
  baby: "M12 2.8a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8ZM6.2 13.4a5.8 5.8 0 0 0 11.6 0V15H6.2v-1.6Z",
  book: "M4.4 3.6h9.2A1.8 1.8 0 0 1 15.4 5.4v14H6.4A2 2 0 0 1 4.4 17.4V3.6Zm11.6 2h3.2v14h-3.2V5.6Z",
  sport:
    "M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm0 2.5 2.8 5H9.2L12 4.7ZM5.6 11.2h6.2L12 17l-2.8-5.8H5.6Zm0 7.8 3.1-5.4 3.1 5.4H5.6Zm12.8 0h-6.2l3.1-5.4 3.1 5.4Z",
  food: "M4.2 2.8v8.2a4.4 4.4 0 0 0 8.8 0V2.8H11v8.2a2.2 2.2 0 1 1-4.4 0V2.8H4.2Zm7.8 10v8.4H14V12.8h-2Zm5.4-5.2V2.8h-2.2v4.6a3.4 3.4 0 1 0 6.8 0h-2.2a1.2 1.2 0 1 1-2.4 0Z",
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
