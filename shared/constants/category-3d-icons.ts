import type { CategoryIconName } from "@/types";

export type Category3dIconName = CategoryIconName | "grid";

/** Premium 3D category icon assets (navy + gold, soft studio lighting). */
export const CATEGORY_3D_ICON_SRC: Record<Category3dIconName, string> = {
  car: "/brand/categories/car.webp",
  laptop: "/brand/categories/laptop.webp",
  briefcase: "/brand/categories/briefcase.webp",
  sofa: "/brand/categories/sofa.webp",
  watch: "/brand/categories/watch.webp",
  phone: "/brand/categories/phone.webp",
  home: "/brand/categories/home.webp",
  wrench: "/brand/categories/wrench.webp",
  paw: "/brand/categories/paw.webp",
  baby: "/brand/categories/baby.webp",
  book: "/brand/categories/book.webp",
  sport: "/brand/categories/sport.webp",
  food: "/brand/categories/food.webp",
  grid: "/brand/categories/grid.webp",
};

export function getCategory3dIconSrc(name: Category3dIconName): string {
  return CATEGORY_3D_ICON_SRC[name] ?? CATEGORY_3D_ICON_SRC.grid;
}
