# SOOQNA — Production performance baseline

Measured **before** any performance code changes.

| Field | Value |
|---|---|
| Production | https://sooqna.site |
| Production commit | `85abbcb` (`docs: record Sooqna 26/26 Production acceptance`) |
| Functional baseline (verified 26/26) | `c3dafb0` |
| Production deployment at measurement | `dpl_87AWthDVy6Mdh4s8BVxZ51ohNzgC` |
| Measured at | 2026-09-09 01:36–01:45 Asia/Dubai (GST) |
| Functional acceptance | 26/26 PASS (unchanged; this file is measurement only) |

## Method

1. **Field-like TTFB / HTML size** — `curl` from GST to `https://sooqna.site` (TLS + `time_starttransfer`). Outliers with ~35s TCP/TLS connect are **network stalls**, not app time; they are excluded from medians.
2. **Lab Core Web Vitals** — Lighthouse 12.8.2, Google Chrome headless, default mobile throttling (Slow 4G + 4× CPU) and desktop preset. One run per URL/profile.
3. **HTML composition** — uncompressed homepage HTML parse (RSC payload, scripts, data URLs).
4. **Code audit** — App Router pages, listing store, Postgres access, client components, fonts, images, notifications, search, admin.

**INP:** Lighthouse lab did not emit INP (no user-flow interaction). **Total Blocking Time (TBT)** is the lab proxy for interaction cost. Field INP is not available from Vercel Web Analytics in this environment.

**Lighthouse TTFB** is the unthrottled Chrome `server-response-time` after a warm-ish connection to the Vercel region. It is **not** comparable 1:1 with GST `curl` TTFB (extra RTT to `iad1`). Both are recorded.

Representative live listing used: `/listings/qa26-car-be50a099` (Nissan Patrol, published QA listing). Secondary: `/listings/office-business-bay`.

---

## 1. Field TTFB and HTML size (curl, GST)

`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`  
`x-vercel-cache: MISS` on every HTML document.

| Page | HTTP | TTFB run 1 | TTFB run 2 | Median TTFB* | Uncompressed HTML |
|---|---|---:|---:|---:|---:|
| `/` | 200 | 484 ms | 35.5 s (connect stall) | **484 ms** | 408,890 B |
| `/search` | 200 | 429 ms | 493 ms | **461 ms** | 277,514 B |
| `/categories` | 200 | 570 ms | 397 ms | **484 ms** | 216,957 B |
| `/listings/office-business-bay` | 200 | 475 ms | 560 ms | **518 ms** | 120,420 B |
| `/listings/qa26-car-be50a099` | 200 | 934 ms | 444 ms | **689 ms** | 215,044 B |
| `/login` | 200 | 557 ms | 420 ms | **489 ms** | 177,756 B |
| `/register` | 200 | 607 ms | 416 ms | **512 ms** | 178,963 B |
| `/profile` (logged-out → auth shell) | 200 | 35.6 s stall / 449 ms | **449 ms** | 112,107 B |
| `/listings/new` | 200 | 7.6 s stall / 35.5 s stall | n/a (stalls) | 169,351 B |
| `/dashboard/listings` | 200 | 452 ms | 433 ms | **443 ms** | 113,005 B |

\*Median of non-stall samples only.

Homepage uncompressed HTML is **~409 KB**. Gzipped document transfer in Lighthouse is ~27–30 KB. The cost is **parse + RSC hydration**, not only the wire.

Homepage HTML composition (uncompressed):

- Inline `<script>` (mostly RSC `self.__next_f`): **~180 KB** across 100 tags; largest chunk ~15.6 KB
- External scripts: 17 chunk URLs
- CSS: 6 stylesheets
- `data:image` strings: 69 (tiny SVG/data URIs, ~8 KB total — not the 409 KB driver)
- Fonts: no `woff2` in the HTML itself (loaded via CSS `@font-face` from `next/font`)
- LCP preload: `/_next/image?...unsplash...w=640` (hero)

---

## 2. Lighthouse lab — Mobile (primary)

Throttling: Lighthouse default mobile. Scores are 0–1.

| Page | Perf score | TTFB (lab) | FCP | LCP | CLS | TBT | Speed Index | Requests | Total | JS | Images | Fonts |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | **0.81** | 53 ms | 1.5 s | **1.8 s** | **0.117** | **540 ms** | 3.1 s | 85 | 735 KB | 313 KB | 213 KB | 121 KB |
| `/search` | 0.85 | 71 ms | 1.5 s | **3.4 s** | 0.000 | 270 ms | 3.4 s | 67 | 491 KB | 298 KB | 0 | 121 KB |
| `/categories` | 0.87 | 52 ms | 1.2 s | **3.0 s** | **0.115** | 230 ms | 1.7 s | 95 | 478 KB | 277 KB | 0 | 121 KB |
| `/listings/qa26-car-be50a099` | **0.73** | 57 ms | 2.1 s | **3.9 s** | 0.061 | **450 ms** | 3.4 s | 58 | 842 KB | **650 KB** | 0* | 121 KB |
| `/login` | 0.95 | 117 ms | 1.1 s | **1.5 s** | 0.000 | 250 ms | 3.0 s | 43 | 437 KB | 262 KB | 1 KB | 121 KB |
| `/register` | 0.87 | 58 ms | 1.1 s | **3.1 s** | 0.000 | 320 ms | 2.0 s | 39 | 427 KB | 256 KB | 1 KB | 121 KB |
| `/profile` (logged-out) | 0.86 | 57 ms | 1.8 s | **3.6 s** | 0.061 | 160 ms | 1.8 s | 73 | 479 KB | 290 KB | 1 KB | 121 KB |
| `/listings/new` | 0.86 | 116 ms | 1.2 s | **3.0 s** | 0.069 | 310 ms | 2.9 s | 49 | 465 KB | 290 KB | 1 KB | 121 KB |

\*Listing-detail “image” transfer is 0 in Lighthouse because the cover is not a separate network image in this run (likely inline/data or not classified as `img` in the resource summary). Gallery still hydrates through the client tree.

### Mobile LCP elements

| Page | LCP node | vs target (≤2.5 s) |
|---|---|---|
| `/` | Hero `<img>` `.market-hero__photo img` (Abu Dhabi skyline) | **PASS** 1.8 s |
| `/search` | Intro `<p>` under H1 (text) | **FAIL** 3.4 s |
| `/categories` | Intro `<p>` `.surface-gradient > p` (text) | **FAIL** 3.0 s |
| Listing | `<h1>` listing title | **FAIL** 3.9 s |
| `/login` | Auth showcase description | PASS 1.5 s |
| `/register` | Auth showcase description | **FAIL** 3.1 s |
| `/listings/new` | PageHero description text | **FAIL** 3.0 s |

### Mobile CLS vs target (≤0.1)

| Page | CLS | Verdict |
|---|---:|---|
| `/` | 0.117 | **OVER** |
| `/categories` | 0.115 | **OVER** |
| Listing | 0.061 | PASS |
| `/search` | 0.000 | PASS |
| `/login` | 0.000 | PASS |

Home mobile TBT **540 ms** is the worst interaction-cost proxy (target INP ≤200 ms is at risk on mid-tier phones).

---

## 3. Lighthouse lab — Desktop

| Page | Perf score | TTFB (lab) | FCP | LCP | CLS | TBT | Speed Index | Requests | Total | JS | Images |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 0.97 | 53 ms | 0.5 s | **1.1 s** | 0.038 | 30 ms | 1.1 s | 102 | 807 KB | 313 KB | 273 KB |
| `/search` | 0.99 | 260 ms | 0.6 s | **0.9 s** | 0.038 | 10 ms | 1.1 s | 77 | 502 KB | 307 KB | 0 |
| `/listings/qa26-car-be50a099` | 0.97 | 87 ms | 0.9 s | **1.0 s** | 0.038 | 10 ms | 1.2 s | 61 | 846 KB | **651 KB** | 0 |

Desktop LCP already meets ≤2.5 s. Desktop CLS meets ≤0.1. Mobile is the gap.

Desktop home LCP element: same hero `<img>` at ~1350×645 CSS px; encoded hero candidate from a warm browser session was **~255 KB** at `w=1920`.

---

## 4. Core Web Vitals vs targets (mobile first)

| Metric | Target | Homepage | Search | Listing |
|---|---|---|---|---|
| LCP | ≤ 2.5 s | 1.8 s PASS | 3.4 s FAIL | 3.9 s FAIL |
| CLS | ≤ 0.1 | 0.117 FAIL | 0.000 PASS | 0.061 PASS |
| INP | ≤ 200 ms | lab n/a; TBT 540 ms | TBT 270 ms | TBT 450 ms |
| Field TTFB (GST) | minimize | ~484 ms | ~461 ms | ~689 ms |

---

## 5. Code / architecture findings (no changes yet)

### Data loading

- `getHomeFeed()` calls `getAllListings()` then slices in memory. Homepage still fetches the **full JSONB catalog**.
- `getEnabledCategories()` also calls `getAllListings()` solely to count active listings per category. Almost every public page uses categories.
- `searchListings()` loads the full catalog, filters in JS, and the search page passes **all matches** into a client list (UI paginates 12, payload does not).
- `getSearchSuggestions` rebuilds an in-memory index from `getAllListings()`.
- `getRelatedListings` / `getMyListings` / admin listings all go through the full catalog.
- Postgres already indexes `status`, `seller_id`, `category_id`. Missing composite indexes for homepage/search patterns: `(status, posted_at)`, `(status, is_featured)`, `(status, category_id, posted_at)`.
- `payload JSONB` stores the entire listing (including gallery). Card queries do not project columns.

Nearby rail renders **6** cards (`getNearbyListings(..., 6)`) but the feed loads **24** listings into RSC.

### Caching

- HTML is `private, no-store` (locale + UA-split homepage). No CDN HTML cache.
- Almost no `unstable_cache` / `revalidate` on public catalog reads.
- `/listings/[slug]` is `force-dynamic` and `generateStaticParams` loads **all** listings + `getMyListings()` at build time.

### JavaScript / client components

- ~150 `"use client"` modules. Header, footer-adjacent chrome, listing cards, listing details, search filters, and i18n wrappers are client.
- `ListingDetailsView` is a client root (gallery, sticky panel, seller, related cards, OSM iframe). Listing page JS **~650 KB transferred**.
- `LiveLocalizer` walks the DOM for EN translation on every page.
- `PremiumListingCard` is client (favorites + locale).
- `SiteHeader` is fully client (session + search + notifications).
- Add-listing form is already `next/dynamic` on `/listings/new`.
- No Stripe.js on public pages (Stripe stays on payment/admin paths). No gtag/maps SDK; listing map is an **eager OSM iframe**.

### Images

- `next/image` + AVIF/WebP enabled. Remote allowlist is **only** `images.unsplash.com`.
- Hero uses `priority` + `sizes="100vw"` → desktop can request **1920px** (~255 KB encoded).
- `AppImage` is a client wrapper (opacity fade except `priority`). That is extra hydration on every card.
- Listing cards use `fill` + reasonable `sizes` for rails.

### Fonts

- `next/font/google`: IBM Plex Sans Arabic 400+700, Inter 700, `display: "swap"`.
- **5 font files, ~121 KB** on every measured page.
- Build-time Google Fonts fetch is a known Production risk (previous IBM Plex fetch failure).

### Notifications

- Header poll **20 s**.
- `GET /api/notifications` loads up to 200 rows then counts unread in JS. Header does not have a count-only query.
- Index exists on `(user_id, created_at DESC)`; no partial unread index.

### Search autocomplete

- Debounce **80 ms** + `AbortController` already present (good).
- Each keystroke can still rebuild/load the full catalog on a cold instance.

### Admin

- `GET /api/admin/listings` returns **all** admin records. Panel filters client-side.

### Auth

- No change planned. Middleware (`proxy.ts`) only peeks JWT role for `/admin`; matcher already skips `_next/static`, `_next/image`, brand assets.

---

## 6. Optimization backlog (for the implementation pass)

Priority order driven by this baseline:

1. Stop loading the full listing catalog for homepage, category counts, search, and related rails — SQL limits + projections.
2. Add indexes matching those queries.
3. Slim card DTOs so RSC HTML drops below ~409 KB uncompressed.
4. Self-host fonts (build reliability + CLS).
5. Hero `sizes` / quality; keep the same photo.
6. Split listing-detail client tree; lazy OSM iframe; cut ~650 KB JS.
7. Notification unread COUNT + slower/visibility-aware poll.
8. Search: server page window + suggest short cache (keep first-character UX).
9. Admin: server-side filter/pagination.
10. Safe `unstable_cache` for public catalog slices only (never auth/notifications/admin).

No code was changed for this document.
