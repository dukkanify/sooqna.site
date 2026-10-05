/**
 * Live HTTP E2E: Create → Pending → Admin Approve → Refresh →
 * Logout/Login → Public → Seller Edit → Admin Edit.
 * Requires a running app (ALLOW_DEMO_ACCOUNTS=true locally).
 *
 *   BASE_URL=http://127.0.0.1:3000 node scripts/audit-e2e-http.mjs
 */
import assert from "node:assert/strict";

const BASE = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const PNG =
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=72";
const PNG2 =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=72";
const STAMP = `qa-audit-${Date.now()}`;

function cookieJar() {
  const bag = new Map();
  return {
    header() {
      return [...bag.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    absorb(response) {
      const raw = response.headers.getSetCookie?.() ?? [];
      for (const line of raw) {
        const part = line.split(";")[0];
        const eq = part.indexOf("=");
        if (eq > 0) bag.set(part.slice(0, eq), part.slice(eq + 1));
      }
    },
    clear() {
      bag.clear();
    },
  };
}

async function request(jar, method, path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(jar.header() ? { Cookie: jar.header() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  jar.absorb(response);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, json, text };
}

async function login(email, password) {
  const jar = cookieJar();
  const { response, json } = await request(jar, "POST", "/api/auth/login/password", {
    email,
    password,
  });
  assert.equal(response.status, 200, `login ${email} → ${response.status} ${JSON.stringify(json)}`);
  assert.equal(json?.ok, true);
  return jar;
}

function listingPayload(partial) {
  const id = `local-${STAMP}-${partial.categoryId}-${Math.random().toString(16).slice(2, 8)}`;
  const title = partial.title;
  return {
    id,
    title,
    slug: `${id}-${partial.categoryId}`,
    description: partial.description ?? `وصف إعلان اختبار ${title}`,
    categoryId: partial.categoryId,
    subcategory: partial.subcategory,
    city: partial.city ?? String(partial.categorySpecs?.city ?? "دبي مارينا"),
    emirate: partial.emirate ?? String(partial.categorySpecs?.emirate ?? "دبي"),
    area: partial.area ?? String(partial.categorySpecs?.city ?? "دبي مارينا"),
    country: "الإمارات",
    price: partial.price ?? 2500,
    currency: "AED",
    condition: partial.condition ?? "used",
    status: "pending_review",
    views: 0,
    imageUrl: PNG,
    images: [PNG, PNG2],
    seller: {
      id: "demo-user-001",
      name: "Ahmed Al Mansoori",
      sellerType: "individual",
      isVerified: true,
    },
    postedAt: new Date().toISOString(),
    categorySpecs: partial.categorySpecs,
    features: partial.features ?? ["قابل للتفاوض"],
    negotiable: true,
    contactPhone: "0501234567",
    contactMethod: "both",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ...partial.extra,
  };
}

const CASES = [
  {
    categoryId: "cars",
    subcategory: "سيدان",
    title: `تويوتا كامري ${STAMP}`,
    price: 48000,
    categorySpecs: {
      brand: "Toyota",
      model: "Camry",
      year: "2021",
      emirate: "دبي",
      city: "دبي مارينا",
      mileage: "42000",
      transmission: "أوتوماتيك",
      fuelType: "بنزين",
    },
  },
  {
    categoryId: "real-estate",
    subcategory: "شقق للبيع",
    title: `شقة للبيع مارينا ${STAMP}`,
    price: 1_250_000,
    categorySpecs: {
      advertiserType: "owner",
      bedrooms: 2,
      bathrooms: 2,
      area: 1100,
      parking: 1,
      furnished: "مفروش",
      completionStatus: "جاهز",
      availabilityTiming: "متاح الآن",
      emirate: "دبي",
      city: "دبي مارينا",
    },
  },
  {
    categoryId: "electronics",
    subcategory: "لابتوبات",
    title: `ماك بوك برو ${STAMP}`,
    price: 4200,
    categorySpecs: {
      brand: "Apple",
      model: "MacBook Pro",
      emirate: "أبوظبي",
      city: "الكورنيش",
      storage: "512 GB",
      ram: "16 GB",
      warranty: "نعم",
      accessories: "شاحن أصلي",
    },
  },
  {
    categoryId: "mobiles",
    subcategory: "آيفون",
    title: `آيفون 15 ${STAMP}`,
    price: 2800,
    categorySpecs: {
      brand: "Apple",
      model: "iPhone 15",
      emirate: "الشارقة",
      city: "الخان",
    },
  },
  {
    categoryId: "books",
    subcategory: "كتب",
    title: `كتاب تاريخ الإمارات ${STAMP}`,
    price: 45,
    categorySpecs: {
      itemType: "كتاب",
      brand: "دار النشر",
      emirate: "دبي",
      city: "بر دبي",
      condition: "new",
    },
  },
  {
    categoryId: "furniture",
    subcategory: "كنب",
    title: `كنب زاوية ${STAMP}`,
    price: 1800,
    categorySpecs: {
      furnitureType: "كنب",
      condition: "used",
      material: "قماش",
      emirate: "عجمان",
      city: "الراشدية",
    },
  },
  {
    categoryId: "fashion",
    subcategory: "ملابس",
    title: `قميص رجالي ${STAMP}`,
    price: 120,
    categorySpecs: {
      itemType: "قميص",
      brand: "Zara",
      emirate: "دبي",
      city: "داون تاون",
      condition: "new",
      size: "L",
    },
  },
  {
    categoryId: "sports",
    subcategory: "دراجات",
    title: `دراجة هوائية ${STAMP}`,
    price: 650,
    categorySpecs: {
      itemType: "دراجة",
      emirate: "دبي",
      city: "جميرا",
      condition: "used",
    },
  },
  {
    categoryId: "kids",
    subcategory: "عربات",
    title: `عربة أطفال ${STAMP}`,
    price: 390,
    categorySpecs: {
      itemType: "عربة أطفال",
      emirate: "الشارقة",
      city: "النهدة",
      condition: "excellent",
    },
  },
  {
    categoryId: "food",
    subcategory: "تمور",
    title: `تمر خلاص ${STAMP}`,
    price: 85,
    categorySpecs: {
      saleType: "retail",
      unitPrice: "AED 85 / كرتون",
      cuisine: "إماراتي",
      portion: "كرتون 3 كجم",
      delivery: "كلاهما",
    },
  },
  {
    categoryId: "services",
    subcategory: "صيانة",
    title: `صيانة مكيفات ${STAMP}`,
    price: 0,
    categorySpecs: {
      businessName: "ورشة الخليج",
      serviceCategory: "صيانة مكيفات",
      coverageArea: "دبي وأبوظبي",
      availability: "حسب الموعد",
      experience: "8",
      pricingBasis: "quote",
    },
  },
  {
    categoryId: "jobs",
    subcategory: "توظيف (وظائف)",
    title: `موظف استقبال فندقي ${STAMP}`,
    price: 0,
    categorySpecs: {
      listingType: "vacancy",
      company: "فندق المرجان",
      position: "موظف استقبال",
      salary: "5,500 – 7,500",
      experience: "سنتان",
      employmentType: "دوام كامل",
      location: "دبي",
    },
  },
];

async function run() {
  const health = await fetch(`${BASE}/login`).catch((error) => {
    throw new Error(`server not reachable at ${BASE}: ${error.message}`);
  });
  assert.ok(health.ok || health.status < 500, `login page ${health.status}`);

  const user = await login("user@sooqna.demo", "User@123");
  const created = [];

  for (const spec of CASES) {
    const listing = listingPayload(spec);
    const { response, json } = await request(user, "POST", "/api/listings", { listing });
    assert.equal(
      response.status,
      201,
      `create ${spec.categoryId} → ${response.status} ${JSON.stringify(json)}`,
    );
    const saved = json.listing;
    assert.equal(saved.status, "pending_review", `${spec.categoryId} must enter pending_review`);
    assert.equal(saved.imageUrl, PNG);
    assert.deepEqual(saved.images.slice(0, 2), [PNG, PNG2]);
    assert.equal(saved.emirate, listing.emirate);
    assert.equal(saved.videoUrl.includes("youtube"), true);
    created.push(saved);
  }

  user.clear();
  const admin = await login("admin@sooqna.demo", "Admin@123");

  const pendingDesk = await request(
    admin,
    "GET",
    "/api/admin/listings",
  );
  assert.equal(pendingDesk.response.status, 200, "admin listings list");

  for (const listing of created) {
    const before = await request(admin, "GET", `/api/admin/listings/${listing.id}`);
    assert.equal(before.response.status, 200, `admin hydrate ${listing.categoryId}`);
    const full = before.json.listing;
    assert.ok(full.categorySpecs, `${listing.categoryId} specs missing on admin GET`);
    assert.ok((full.images ?? []).length >= 1, `${listing.categoryId} images missing on admin GET`);
    assert.equal(full.status, "pending_review");

    const approve = await request(admin, "PATCH", `/api/admin/listings/${listing.id}`, {
      status: "active",
    });
    assert.equal(
      approve.response.status,
      200,
      `approve ${listing.categoryId} → ${approve.response.status} ${JSON.stringify(approve.json)}`,
    );
    assert.equal(approve.json.listing.status, "active");
  }

  // Refresh: new admin session still sees active + original media/specs.
  admin.clear();
  const admin2 = await login("admin@sooqna.demo", "Admin@123");
  for (const listing of created) {
    const again = await request(admin2, "GET", `/api/admin/listings/${listing.id}`);
    assert.equal(again.json.listing.status, "active", `persist ${listing.categoryId}`);
    assert.equal(again.json.listing.imageUrl, PNG);
    assert.equal(again.json.listing.contactPhone, "0501234567");
    for (const [key, value] of Object.entries(listing.categorySpecs ?? {})) {
      assert.equal(
        String(again.json.listing.categorySpecs?.[key] ?? ""),
        String(value),
        `${listing.categoryId} lost spec ${key}`,
      );
    }
  }

  // Public pages (SSR may bail to CSR via next/dynamic — status + title in payload).
  for (const listing of created) {
    const page = await fetch(`${BASE}/listings/${encodeURIComponent(listing.slug)}`);
    assert.equal(page.status, 200, `public ${listing.categoryId} ${page.status}`);
    const html = await page.text();
    assert.doesNotMatch(html, />live-mkt-\d+</);
    assert.doesNotMatch(html, />user-\d{10,}[a-z0-9-]*</);
    assert.match(html, new RegExp(listing.title.slice(0, 8)));
  }

  // Seller logout/login then edit title only — other fields must survive.
  const user2 = await login("user@sooqna.demo", "User@123");
  for (const listing of created) {
    const nextTitle = `${listing.title} محدّث`;
    const patch = await request(user2, "PATCH", `/api/listings/${listing.id}`, {
      title: nextTitle,
    });
    assert.equal(
      patch.response.status,
      200,
      `seller edit ${listing.categoryId} → ${patch.response.status} ${JSON.stringify(patch.json)}`,
    );
    const saved = patch.json.listing;
    assert.equal(saved.title, nextTitle);
    assert.equal(saved.imageUrl, PNG);
    assert.deepEqual(saved.images.slice(0, 2), [PNG, PNG2]);
    assert.equal(saved.videoUrl.includes("youtube"), true);
    assert.equal(saved.status, "active");
    assert.equal(saved.emirate, listing.emirate);
    assert.equal(saved.price, listing.price, `${listing.categoryId} price wiped on title-only edit`);
    for (const [key, value] of Object.entries(listing.categorySpecs ?? {})) {
      assert.equal(
        String(saved.categorySpecs?.[key] ?? ""),
        String(value),
        `${listing.categoryId} seller edit lost ${key}`,
      );
    }
  }

  // Admin edits a single spec and must not drop images / location / video.
  for (const listing of created) {
    const patch = await request(admin2, "PATCH", `/api/admin/listings/${listing.id}`, {
      description: `${listing.description}\nتحديث أدمن`,
    });
    assert.equal(patch.response.status, 200, `admin edit ${listing.categoryId}`);
    const saved = patch.json.listing;
    assert.match(saved.description, /تحديث أدمن/);
    assert.equal(saved.imageUrl, PNG);
    assert.equal(saved.videoUrl.includes("youtube"), true);
    assert.equal(saved.emirate, listing.emirate);
    assert.equal(saved.status, "active");
    assert.equal(saved.price, listing.price);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        base: BASE,
        stamp: STAMP,
        categories: created.map((item) => ({
          id: item.id,
          categoryId: item.categoryId,
          slug: item.slug,
          status: "active",
        })),
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
