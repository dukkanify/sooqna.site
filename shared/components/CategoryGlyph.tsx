import type { CategoryIconName } from "@/types";

type GlyphName = CategoryIconName | "grid";

type CategoryGlyphProps = {
  className?: string;
  name: GlyphName;
  size?: number;
};

/**
 * Professional filled silhouettes for navy category marks.
 * Paths stay bold and centered so shapes stay readable at ~28–40px.
 */
const FILLED: Record<GlyphName, string> = {
  // Side-profile sedan — instantly readable at small sizes
  car: "M4.1 14.2h1.05c.28-1.55 1.55-2.55 3.15-2.55h.55l1.35-3.45A1.9 1.9 0 0 1 12 6.7h4.35c.72 0 1.38.4 1.7 1.05L19.7 11.7H20.4c.55 0 1 .45 1 1v2.15c0 .55-.45 1-1 1h-.55a2.55 2.55 0 0 1-5.05 0h-3.5a2.55 2.55 0 0 1-5.05 0H4.1c-.55 0-1-.45-1-1v-1.15c0-.55.45-1 1-1Zm4.2.95a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7Zm7.7 0a1.35 1.35 0 1 0 0-2.7 1.35 1.35 0 0 0 0 2.7ZM12.15 8.05l-1.05 2.7h6.55l-1.2-2.45a.45.45 0 0 0-.4-.25h-3.9Z",
  // House with chimney — clear roof + door
  home: "M11.2 3.35 3.6 9.85a.85.85 0 0 0 .55 1.5H5.5V20a1 1 0 0 0 1 1h3.9v-5.1h3.2V21h3.9a1 1 0 0 0 1-1v-8.65h1.35a.85.85 0 0 0 .55-1.5L12.85 3.35a1.2 1.2 0 0 0-1.65 0ZM17.2 5.1v1.85l1.55 1.3V5.1h-1.55Z",
  // Open laptop with base
  laptop:
    "M5.2 5.1A1.7 1.7 0 0 1 6.9 3.4h10.2A1.7 1.7 0 0 1 18.8 5.1v8.35H5.2V5.1Zm-.9 9.85h15.4l1.05 1.55A1.5 1.5 0 0 1 19.5 18.9H4.5a1.5 1.5 0 0 1-1.25-2.4l1.05-1.55Z",
  // Modern phone with home indicator
  phone:
    "M8.05 2.2h7.9A2.15 2.15 0 0 1 18.1 4.35v15.3A2.15 2.15 0 0 1 15.95 21.8H8.05A2.15 2.15 0 0 1 5.9 19.65V4.35A2.15 2.15 0 0 1 8.05 2.2Zm2.2 1.35h3.5a.55.55 0 0 1 0 1.1h-3.5a.55.55 0 0 1 0-1.1Zm1.75 14.55a1.05 1.05 0 1 0 0-2.1 1.05 1.05 0 0 0 0 2.1Z",
  // Armchair — seat + arms + back clearly separated
  sofa: "M8.1 9.6V7.85A2.55 2.55 0 0 1 10.65 5.3h2.7A2.55 2.55 0 0 1 15.9 7.85V9.6h1.35A2 2 0 0 1 19.25 11.6v4.15H4.75V11.6A2 2 0 0 1 6.75 9.6H8.1ZM5.35 17.35h2.35v-1h8.6v1h2.35V16H5.35v1.35Z",
  // Briefcase with handle + clasp
  briefcase:
    "M9.05 3.95h5.9A1.55 1.55 0 0 1 16.5 5.5v1.15h1.85A1.7 1.7 0 0 1 20.05 8.35v9.35A1.7 1.7 0 0 1 18.35 19.4H5.65A1.7 1.7 0 0 1 3.95 17.7V8.35A1.7 1.7 0 0 1 5.65 6.65H7.5V5.5A1.55 1.55 0 0 1 9.05 3.95Zm1.4 1.55v1.15h3.1V5.5h-3.1Zm-.2 5.55h4.5v1.35h-1.55v1.85h-1.4v-1.85H10.25V11.05Z",
  // Watch with strap + crown + hands
  watch:
    "M9.35 2.15h5.3v2.85h-5.3V2.15Zm0 16.85h5.3v2.85h-5.3v-2.85ZM12 5.85a6.15 6.15 0 1 1 0 12.3 6.15 6.15 0 0 1 0-12.3Zm0 1.9a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5Zm.55 1.2v2.55l1.85 1.1-.55.95-2.4-1.45V8.95h1.1ZM17.85 11.15h1.55v1.7h-1.55v-1.7Z",
  // Paw print — four toes + pad
  paw: "M7.85 7.55a2.15 2.15 0 1 0 0-4.3 2.15 2.15 0 0 0 0 4.3Zm8.3 0a2.15 2.15 0 1 0 0-4.3 2.15 2.15 0 0 0 0 4.3ZM5.05 12.55a2.15 2.15 0 1 0 0-4.3 2.15 2.15 0 0 0 0 4.3Zm13.9 0a2.15 2.15 0 1 0 0-4.3 2.15 2.15 0 0 0 0 4.3ZM12 20.55c3.55 0 6.4-2.35 6.4-5.25S15.55 10.9 12 10.9s-6.4 1.5-6.4 4.4 2.85 5.25 6.4 5.25Z",
  // Adjustable wrench
  wrench:
    "M15.35 2.85a5 5 0 0 0-6.75 6.75L3.2 15l1.05 1.05 2.15-.2 1.85 1.85-.2 2.15 1.05 1.05 5.95-5.95a5 5 0 0 0 6.75-6.75l-2.85 2.85-2.55-2.55 2.85-2.85Z",
  // Baby / kids — head + body
  baby: "M12 2.55a3.55 3.55 0 1 1 0 7.1 3.55 3.55 0 0 1 0-7.1ZM6.15 13.25a5.85 5.85 0 0 0 11.7 0V15.1H6.15v-1.85Z",
  // Open book
  book: "M4.2 3.45h8.85A1.9 1.9 0 0 1 14.95 5.35v14.1H6.35A2.15 2.15 0 0 1 4.2 17.3V3.45Zm11.55 2.1h3.55v14.1h-3.55V5.55Z",
  // Sports ball with seams
  sport:
    "M12 2.15a9.85 9.85 0 1 0 0 19.7 9.85 9.85 0 0 0 0-19.7Zm0 2.35 2.95 5.25H9.05L12 4.5ZM5.45 11.1h6.45L12 17.15 9.05 11.1H5.45Zm0 8.15 3.2-5.55 3.2 5.55H5.45Zm13.1 0h-6.4l3.2-5.55 3.2 5.55Z",
  // Utensils — fork + spoon
  food: "M5.15 2.55v7.85a3.55 3.55 0 0 0 3.45 3.55V21.4h1.85v-7.45A3.55 3.55 0 0 0 13.9 10.4V2.55h-1.85v7.85a1.7 1.7 0 1 1-3.4 0V2.55H5.15Zm9.85 8.85V21.4h1.85v-9.95a3.4 3.4 0 0 0 3.15-3.35V2.55h-1.85v5.55a1.55 1.55 0 1 1-3.1 0V2.55h-1.85v8.85h1.8Z",
  // 2×2 grid for "more"
  grid: "M3.35 3.35h7.15v7.15H3.35V3.35Zm10.15 0h7.15v7.15h-7.15V3.35ZM3.35 13.5h7.15v7.15H3.35V13.5Zm10.15 0h7.15v7.15h-7.15V13.5Z",
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
