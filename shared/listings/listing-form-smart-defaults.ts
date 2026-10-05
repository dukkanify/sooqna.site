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

/** Keep in sync with jobs-taxonomy.listingTypeFromSubcategory (no cross-import for node tests). */
function jobsListingTypeFromSubcategory(
  subcategory: string | undefined | null,
): "vacancy" | "seeker" {
  const value = String(subcategory ?? "").trim();
  if (
    value === "باحثون عن عمل" ||
    value.includes("باحث") ||
    /^seeker$/i.test(value)
  ) {
    return "seeker";
  }
  return "vacancy";
}

const EV_SUBCATEGORIES = new Set(["سيارات كهربائية", "كهربائية"]);
const EV_BRAND_PATTERN =
  /^(tesla|byd|lucid|rivian|polestar|nio|xpeng|zeekr|li\s*auto|leapmotor|hongqi\s*e|Ora)$/i;
const EV_MODEL_HINT =
  /\b(model\s*[3yxys]|cybertruck|leaf|ioniq\s*5|ioniq\s*6|ev6|id\.?\s*4|eq[ces]|e-tron|taycan|et[57]|atto|seal|dolphin|han\s*ev|tang\s*ev|song\s*plus)\b/i;

const PET_ANIMAL_TYPES = ["قطط", "كلاب", "طيور", "مستلزمات"] as const;
const FURNITURE_TYPES = ["غرف نوم", "كنب", "طاولات طعام", "أثاث خارجي"] as const;
const GOODS_CATEGORY_IDS = new Set(["fashion", "kids", "sports", "books"]);

/** Shown under fields the form filled for the seller. */
export const SMART_FILL_HINT_AR = "تم اختياره تلقائياً — يمكنك تعديله";

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
  fuelType?: string;
  model?: string;
  subcategory?: string;
}): boolean {
  if (input.fuelType?.trim() === "كهربائي") return true;
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
  const fuelExisting = existing.fuelType || next.fuelType || "";

  if (
    isElectricVehicleHint({
      brand: ctx.brand,
      fuelType: fuelExisting,
      model: ctx.model,
      subcategory,
    })
  ) {
    setIfEmpty(next, existing, "fuelType", "كهربائي");
    // Nearly all EVs are single-speed automatic — prefill; seller can change.
    setIfEmpty(next, existing, "transmission", "أوتوماتيك");
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

function inferJobsSmartDefaults(
  ctx: SmartDefaultContext,
  next: Record<string, string>,
) {
  const existing = ctx.existing ?? {};
  const subcategory = ctx.subcategory?.trim() ?? "";
  if (!subcategory) return;
  setIfEmpty(
    next,
    existing,
    "listingType",
    jobsListingTypeFromSubcategory(subcategory),
  );
}

function inferElectronicsSmartDefaults(
  ctx: SmartDefaultContext,
  next: Record<string, string>,
) {
  const existing = ctx.existing ?? {};
  const model = ctx.model?.trim() ?? "";
  const subcategory = ctx.subcategory?.trim() ?? "";
  const haystack = `${model} ${subcategory}`.toLowerCase();

  if (/playstation|ps\s*[45]|dualsense/i.test(haystack)) {
    setIfEmpty(next, existing, "brand", "Sony");
  } else if (/xbox/i.test(haystack)) {
    setIfEmpty(next, existing, "brand", "Microsoft");
  } else if (/nintendo|switch/i.test(haystack)) {
    setIfEmpty(next, existing, "brand", "Nintendo");
  } else if (/macbook|ipad/i.test(haystack)) {
    setIfEmpty(next, existing, "brand", "Apple");
  } else if (/\beos\b/i.test(haystack)) {
    setIfEmpty(next, existing, "brand", "Canon");
  } else if (/\ba7\b|alpha\s*7/i.test(haystack)) {
    setIfEmpty(next, existing, "brand", "Sony");
  } else if (subcategory === "سماعات" && /bose|jbl|beats|sony/i.test(model)) {
    if (/bose/i.test(model)) setIfEmpty(next, existing, "brand", "Bose");
    else if (/jbl/i.test(model)) setIfEmpty(next, existing, "brand", "JBL");
    else if (/beats/i.test(model)) setIfEmpty(next, existing, "brand", "Beats");
    else if (/sony/i.test(model)) setIfEmpty(next, existing, "brand", "Sony");
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
  } else if (ctx.categoryId === "jobs") {
    inferJobsSmartDefaults(ctx, next);
  } else if (ctx.categoryId === "electronics") {
    inferElectronicsSmartDefaults(ctx, next);
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
