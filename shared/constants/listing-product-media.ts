import {
  galleryFromPool,
  unsplashUrl,
  type ImageFallbackCategory,
} from "@/shared/constants/image-fallbacks";

/**
 * Product-kind photo pools — keep covers visually matched to the listing title
 * so home cards, detail gallery, and checkout all show the same coherent media.
 */
const PRODUCT_PHOTO_POOLS = {
  smartphone: [
    "photo-1511707171634-5f897ff02aa9",
    "photo-1592890288564-76628a30a657",
    "photo-1580910051074-3eb694886505",
    "photo-1601784551446-20c9e07cdbdb",
    "photo-1727013884184-b313982327f3",
    "photo-1678911820864-e2c567c655d7",
  ],
  smartwatch: [
    "photo-1434493789847-2f02dc6ca35d",
    "photo-1579586337278-3befd40fd17a",
    "photo-1546868871-7041f2a55e12",
    "photo-1523275335684-37898b6baf30",
  ],
  earbuds: [
    "photo-1606220945770-b5b6c2c55bf1",
    "photo-1590658268037-6bf12165a8df",
    "photo-1484704849700-f032a568e944",
  ],
  tablet: [
    "photo-1544244015-0df4b3ffc6b0",
    "photo-1561154464-82e9adf32764",
    "photo-1736767431540-0d590ba5efc2",
  ],
  laptop: [
    "photo-1517336714731-489689fd1ca8",
    "photo-1496181133206-80ce9b88a853",
    "photo-1622297845775-5ff3fef71d13",
  ],
  gaming: [
    "photo-1606813907291-d86efa9b94db",
    "photo-1493711662062-fa541adb3fc8",
    "photo-1621259182978-fbf93132d53d",
  ],
  camera: [
    "photo-1516035069371-29a1b244cc32",
    "photo-1502920917128-1aa500764cbd",
    "photo-1452587925148-ce544e77e70d",
  ],
  tv: [
    "photo-1593359677879-a4bb92f829d1",
    "photo-1461151304267-38535e780c79",
  ],
  apartment: [
    "photo-1502672260266-1c1ef2d93688",
    "photo-1522708323590-d24dbb6b0267",
    "photo-1560448204-e02f11c3d0e2",
    "photo-1631049307264-da0ec9d70304",
    "photo-1505693416388-ac5ce068fe85",
    "photo-1616594039964-ae9021a400a0",
  ],
  villa: [
    "photo-1600585154340-be6161a56a0c",
    "photo-1600596542815-ffad4c1539a9",
    "photo-1613490493576-7fde63acd811",
    "photo-1600566753190-17f0baa2a6c3",
    "photo-1600607687939-ce8a6c25118c",
  ],
  office: [
    "photo-1497366811353-6870744d04b2",
    "photo-1497366754035-f200968a6e72",
    "photo-1497366216548-37526070297c",
    "photo-1524758631624-e2822e304c36",
  ],
  honey: [
    "photo-1587049352846-4a222e784d38",
    "photo-1474979266404-7eaacbcd87c5",
    "photo-1558642452-9d2a7deb7f62",
  ],
  dates: [
    "photo-1606313564200-e75d5e30476c",
    "photo-1504674900247-0877df9cc836",
    "photo-1546069901-ba9599a7e63c",
  ],
  suv: [
    "photo-1519641471654-76ce0107ad1b",
    "photo-1533473359331-0135ef1b58bf",
    "photo-1503376780353-7e6692767b70",
    "photo-1494976388531-d1058494cdd8",
    "photo-1549317661-bd32c8ce0db2",
    "photo-1606664515524-ed2f786a0bd6",
  ],
} as const;

type ProductKind = keyof typeof PRODUCT_PHOTO_POOLS;

const PRODUCT_HINTS: Array<{ kind: ProductKind; pattern: RegExp }> = [
  { kind: "honey", pattern: /\b(honey|sidr|عسل)\b/i },
  { kind: "dates", pattern: /\b(khalas|medjool|ajwa|تمر|تمور|خلاص)\b/i },
  {
    kind: "suv",
    pattern:
      /\b(patrol|land\s*cruiser|prado|fortuner|tahoe|suburban|cayenne|x5|x7|gx|lx|باترول|لاندكروزر|برادو)\b/i,
  },
  {
    kind: "smartwatch",
    pattern: /\b(watch|watches|ساعة|ساعات|رولكس|rolex|omega|cartier|submariner)\b/i,
  },
  {
    kind: "earbuds",
    pattern: /\b(airpods|earbuds|earphones|سماعات|سماعة)\b/i,
  },
  {
    kind: "tablet",
    pattern: /\b(ipad|tablet|تابلت|آيباد)\b/i,
  },
  {
    kind: "laptop",
    pattern: /\b(macbook|laptop|notebook|لابتوب|حاسوب محمول)\b/i,
  },
  {
    kind: "gaming",
    pattern: /\b(playstation|xbox|nintendo|ps5|gaming|ألعاب|بلايستيشن)\b/i,
  },
  {
    kind: "camera",
    pattern: /\b(camera|canon|sony a7|nikon|كاميرا|عدسة)\b/i,
  },
  {
    kind: "tv",
    pattern: /\b(tv|television|oled|تلفزيون|شاشة تلفاز)\b/i,
  },
  {
    kind: "smartphone",
    pattern:
      /\b(iphone|galaxy|pixel|xiaomi|huawei|oppo|oneplus|آيفون|جالكسي|موبايل|هاتف)\b/i,
  },
  {
    kind: "villa",
    pattern: /\b(villa|townhouse|duplex|penthouse|فيلا|تاون|دوبلكس|بنتهاوس)\b/i,
  },
  {
    kind: "office",
    pattern: /\b(office|retail|shop|مكتب|محل|تجاري)\b/i,
  },
  {
    kind: "apartment",
    pattern: /\b(apartment|studio|flat|شقة|استوديو|غرف)\b/i,
  },
];

function seedOffset(seed: string, length: number): number {
  let offset = 0;
  for (let i = 0; i < seed.length; i += 1) {
    offset = (offset + seed.charCodeAt(i) * (i + 1)) % length;
  }
  return offset;
}

function galleryFromPhotoIds(
  photoIds: readonly string[],
  seed: string,
  count: number,
  width: number,
): string[] {
  if (photoIds.length === 0) return [];
  const offset = seedOffset(seed, photoIds.length);
  const urls: string[] = [];
  for (let i = 0; i < photoIds.length && urls.length < count; i += 1) {
    const url = unsplashUrl(photoIds[(offset + i) % photoIds.length], width);
    if (!urls.includes(url)) urls.push(url);
  }
  return urls;
}

function detectProductKind(text: string): ProductKind | undefined {
  for (const hint of PRODUCT_HINTS) {
    if (hint.pattern.test(text)) return hint.kind;
  }
  return undefined;
}

export type ListingProductMediaInput = {
  categoryId: string;
  count?: number;
  imageCategory?: ImageFallbackCategory;
  seed: string;
  title?: string;
  titleEnglish?: string;
  width?: number;
};

/** Stable gallery for a listing — product-aware first, then category pool. */
export function galleryForListingProduct({
  categoryId,
  count = 4,
  imageCategory,
  seed,
  title = "",
  titleEnglish = "",
  width = 1200,
}: ListingProductMediaInput): string[] {
  const text = `${titleEnglish} ${title} ${categoryId}`;
  const kind = detectProductKind(text);
  if (kind) {
    return galleryFromPhotoIds(PRODUCT_PHOTO_POOLS[kind], seed, count, width);
  }

  const category =
    imageCategory ??
    ((categoryId in {
      cars: 1,
      "real-estate": 1,
      electronics: 1,
      mobiles: 1,
      furniture: 1,
      jobs: 1,
      fashion: 1,
      services: 1,
      pets: 1,
      kids: 1,
      books: 1,
      sports: 1,
      food: 1,
    }
      ? categoryId
      : "default") as ImageFallbackCategory);

  return galleryFromPool(category, seed, count, width);
}
