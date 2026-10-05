/**
 * Smart defaults for the add/edit listing form.
 * Fill empty related specs from category, subcategory, brand, or model —
 * never overwrite a value the seller already chose.
 */

export type SmartDefaultContext = {
  brand?: string;
  categoryId: string;
  existing?: Record<string, string>;
  model?: string;
  subcategory?: string;
};

const EV_SUBCATEGORIES = new Set(["سيارات كهربائية", "كهربائية"]);
const EV_BRAND_PATTERN =
  /^(tesla|byd|lucid|rivian|polestar|nio|xpeng|zeekr|li\s*auto|leapmotor|hongqi\s*e|Ora)$/i;
const EV_MODEL_HINT =
  /\b(model\s*[3yxys]|cybertruck|leaf|ioniq\s*5|ioniq\s*6|ev6|id\.?\s*4|eq[ces]|e-tron|taycan|et[57]|atto|seal|dolphin|han\s*ev|tang\s*ev|song\s*plus)\b/i;

const PET_ANIMAL_TYPES = ["قطط", "كلاب", "طيور", "مستلزمات"] as const;
const FURNITURE_TYPES = ["غرف نوم", "كنب", "طاولات طعام", "أثاث خارجي"] as const;
const GOODS_CATEGORY_IDS = new Set(["fashion", "kids", "sports", "books"]);

function empty(value: string | undefined): boolean {
  return !value?.trim();
}

function setIfEmpty(
  next: Record<string, string>,
  existing: Record<string, string>,
  key: string,
  value: string,
) {
  if (!empty(existing[key]) || !empty(next[key])) return;
  if (!value.trim()) return;
  next[key] = value.trim();
}

function isElectricVehicleHint(input: {
  brand?: string;
  model?: string;
  subcategory?: string;
}): boolean {
  const subcategory = input.subcategory?.trim() ?? "";
  if (EV_SUBCATEGORIES.has(subcategory) || /كهرب|electric|\bev\b/i.test(subcategory)) {
    return true;
  }
  const brand = input.brand?.trim() ?? "";
  if (brand && EV_BRAND_PATTERN.test(brand)) return true;
  const model = input.model?.trim() ?? "";
  if (model && EV_MODEL_HINT.test(model)) return true;
  if (/كهرب|electric|\bev\b/i.test(`${brand} ${model}`)) return true;
  return false;
}

function inferCarsSmartDefaults(
  ctx: SmartDefaultContext,
  next: Record<string, string>,
) {
  const existing = ctx.existing ?? {};
  const subcategory = ctx.subcategory?.trim() ?? "";

  if (isElectricVehicleHint(ctx)) {
    setIfEmpty(next, existing, "fuelType", "كهربائي");
  } else if (/هجين|hybrid/i.test(subcategory)) {
    setIfEmpty(next, existing, "fuelType", "هجين");
  } else if (/ديزل|diesel/i.test(subcategory)) {
    setIfEmpty(next, existing, "fuelType", "ديزل");
  }

  if (subcategory === "سيارات مستعملة") {
    setIfEmpty(next, existing, "condition", "used");
  }

  // Electric cars do not need engine capacity — drop a stale draft value.
  const fuel = next.fuelType || existing.fuelType || "";
  if (fuel === "كهربائي" || EV_SUBCATEGORIES.has(subcategory)) {
    if (empty(existing.engineSize) && next.engineSize) {
      delete next.engineSize;
    }
  }
}

function inferRealEstateSmartDefaults(
  ctx: SmartDefaultContext,
  next: Record<string, string>,
) {
  const existing = ctx.existing ?? {};
  const subcategory = ctx.subcategory?.trim() ?? "";
  if (!subcategory) return;

  if (/للإيجار|rent/i.test(subcategory)) {
    setIfEmpty(next, existing, "purpose", "للإيجار");
  } else if (/للبيع|sale/i.test(subcategory)) {
    setIfEmpty(next, existing, "purpose", "للبيع");
  }

  if (/شقق|apartment/i.test(subcategory)) {
    setIfEmpty(next, existing, "propertyType", "شقة");
  } else if (/فلل|villa/i.test(subcategory)) {
    setIfEmpty(next, existing, "propertyType", "فيلا");
  } else if (/مكاتب|office/i.test(subcategory)) {
    setIfEmpty(next, existing, "propertyType", "مكتب");
  }
}

function inferMobilesSmartDefaults(
  ctx: SmartDefaultContext,
  next: Record<string, string>,
) {
  const existing = ctx.existing ?? {};
  const subcategory = ctx.subcategory?.trim() ?? "";
  if (subcategory === "آيفون") {
    setIfEmpty(next, existing, "brand", "Apple");
  } else if (subcategory === "سامسونج") {
    setIfEmpty(next, existing, "brand", "Samsung");
  }
}

function inferBranchTypeDefaults(
  ctx: SmartDefaultContext,
  next: Record<string, string>,
) {
  const existing = ctx.existing ?? {};
  const subcategory = ctx.subcategory?.trim() ?? "";
  if (!subcategory) return;

  if (
    ctx.categoryId === "pets" &&
    (PET_ANIMAL_TYPES as readonly string[]).includes(subcategory)
  ) {
    setIfEmpty(next, existing, "animalType", subcategory);
  }
  if (
    ctx.categoryId === "furniture" &&
    (FURNITURE_TYPES as readonly string[]).includes(subcategory)
  ) {
    setIfEmpty(next, existing, "furnitureType", subcategory);
  }
  if (GOODS_CATEGORY_IDS.has(ctx.categoryId)) {
    setIfEmpty(next, existing, "itemType", subcategory);
  }
}

/**
 * Returns only keys that should be filled (empty in `existing`).
 * Safe to merge into form state or submit parsing.
 */
export function inferListingFormSmartSpecs(
  ctx: SmartDefaultContext,
): Record<string, string> {
  const next: Record<string, string> = {};
  if (!ctx.categoryId) return next;

  inferBranchTypeDefaults(ctx, next);

  if (ctx.categoryId === "cars") {
    inferCarsSmartDefaults(ctx, next);
  } else if (ctx.categoryId === "real-estate") {
    inferRealEstateSmartDefaults(ctx, next);
  } else if (ctx.categoryId === "mobiles") {
    inferMobilesSmartDefaults(ctx, next);
  }

  return next;
}

/** Merge smart fills into an existing specs map without overwriting seller choices. */
export function applyListingFormSmartSpecs(
  ctx: SmartDefaultContext,
): Record<string, string> {
  const existing = { ...(ctx.existing ?? {}) };
  const inferred = inferListingFormSmartSpecs({ ...ctx, existing });
  return { ...existing, ...inferred };
}
