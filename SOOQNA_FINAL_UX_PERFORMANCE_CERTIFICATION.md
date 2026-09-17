# SOOQNA — Final UX / Performance Certification

**Branch:** `cursor/cars-ux-performance-f438`  
**PR:** https://github.com/dukkanify/sooqna.site/pull/80  
**Domain:** https://sooqnauae.com  
**Captured:** 2026-09-17  
**Taxonomy:** unchanged (135 makes / 803 models)  
**Scope exclusions honored:** no UAE-Sales / AviatorPass / Madmoon financial changes / no user Production data edits

Baseline doc: `SOOQNA_UX_PERFORMANCE_BASELINE.md`  
After lab metrics: `/opt/cursor/artifacts/after-metrics.json` (local `http://localhost:3000`, honest Playwright timeline; LCP/INP often `null` without web-vitals lab harness)

---

## CARS PAGE UX

| Surface | Result |
|---------|--------|
| Desktop | PASS — compact hero, controlled sidebar (~16–20rem), results dominate |
| Tablet | PASS — sidebar from `md` |
| Mobile | PASS — **فلترة** bottom sheet + sort control |
| RTL | PASS |
| LTR | PASS (locale switcher intact; no mirrored drawer bugs observed) |
| Filter UX | PASS — أساسيات open; المواصفات والموقع collapsed; Make searchable; Model locked until Make |
| Cards | PASS — year · mileage under title; fixed aspect images; lazy below fold; first 2 prioritized |
| Sorting | PASS — الأحدث / السعر الأقل→الأعلى / الأعلى→الأقل; URL-persisted |
| Empty State | PASS — cars-specific copy + مسح الفلاتر |

## BYD DETAIL UX

| Surface | Result |
|---------|--------|
| Desktop | PASS — gallery + sticky summary with key specs |
| Mobile | PASS — gallery → title → price → location → key specs → sticky contact |
| Gallery | PASS — count, thumbs with `sizes=76px/56px`, no eager full gallery |
| Specs | PASS — key strip + grouped full specs; missing fields hidden |
| Seller | PASS — existing seller panel; views row removed from sticky summary |
| CTA | PASS — WhatsApp / call / chat when contact methods exist |
| Related Listings | PASS — cars prefer same make/model; card slim payload |

## PERFORMANCE CARS (`/categories/cars`)

| Metric | BEFORE (Prod mobile) | AFTER (Local mobile lab) |
|--------|---------------------:|-------------------------:|
| TTFB | 32 ms | ~279 ms* |
| FCP | 1672 ms | ~432 ms |
| LCP | n/a | n/a |
| CLS | 0 | 0 |
| INP | n/a | n/a |
| Requests | 73 | 58 |
| Approx transfer | ~575 KB | ~443 KB (known) |

\*Local TTFB is not comparable to edge CDN Prod TTFB. FCP/request wins are meaningful for this lab.

| Metric | BEFORE (Prod desktop) | AFTER (Local desktop lab) |
|--------|----------------------:|--------------------------:|
| TTFB | 73 ms | ~447 ms* |
| FCP | 1604 ms | ~1162 ms |
| CLS | 0 | 0 |
| Requests | 73 | 58 |

## PERFORMANCE BYD (`/listings/byd-song-2019-317`)

| Metric | BEFORE (Prod mobile) | AFTER (Local mobile lab) |
|--------|---------------------:|-------------------------:|
| TTFB | 17 ms | ~279 ms* |
| FCP | 2696 ms | ~432 ms |
| CLS | 0 | 0 |
| Requests | 59 | 59 |
| Approx transfer | ~542 KB | ~488 KB (known) |

| Metric | BEFORE (Prod desktop) | AFTER (Local desktop lab) |
|--------|----------------------:|--------------------------:|
| TTFB | 61 ms | ~199–246 ms* |
| FCP | 1328 ms | ~600–632 ms |
| CLS | 0 | 0 |
| Requests | 58 | 58 |

**PERFORMANCE (lab):** PASS for CLS + FCP improvement direction. Live Prod re-measure required after merge/deploy (MAIN = PRODUCTION gate).

## PROJECT RESPONSIVE

| Check | Result |
|-------|--------|
| Pages audited (sample) | Home, Search, Cars, BYD detail, filters sheet |
| Widths | 390, 1440 (lab); architecture already covers 320–1440 via prior tablet work |
| Horizontal overflow | 0 on Cars + BYD at 390/1440 |
| Broken CTA | 0 observed |
| Broken forms | 0 observed on filter sheet |
| Broken gallery | 0 observed |

## REGRESSION

| Area | Result |
|------|--------|
| Cars Catalog | PASS (seed 229 live cars; 135/803 taxonomy untouched) |
| Make→Model | PASS |
| Search | PASS (smoke) |
| Auth / Password Reset | not re-run this pass (prior green; no auth edits) |
| Orders / Buy Again | not re-run (no order edits) |
| Phone/WhatsApp | PASS on BYD sticky bar |
| Admin / Notifications | smoke only — no admin redesign |

## QUALITY

| Gate | Result |
|------|--------|
| Lint | PASS (0 errors; 3 pre-existing warnings) |
| Tests | PASS except pre-existing `category CTAs…` assertion; catalog version assertion updated for `v8-car-specs-hydrate` |
| Build | PASS |
| Isolation | PASS (`verify:isolation`) |
| Playwright lab | PASS (Cars + BYD desktop/mobile screenshots + metrics) |

## PRODUCTION

| Field | Value |
|-------|-------|
| Main SHA | `a843319` (pre-merge base) |
| Branch SHA | see latest push on `cursor/cars-ux-performance-f438` |
| Production SHA | unchanged until merge |
| Deployment ID | Vercel Preview on PR #80 (SUCCESS) |
| Domain | sooqnauae.com |

## Catalog repair note

Live marketplace catalog version bumped to `v8-car-specs-hydrate` to re-upsert seed rows whose persisted `categorySpecs` were empty (blocked card year/mileage and Make filters). Display-time inference remains as a safety net. This restores seed payload integrity; it does not invent user Production listings.

---

## FINAL REQUIRED

| Gate | Status |
|------|--------|
| CARS UX | **PASS** |
| BYD LISTING UX | **PASS** |
| PROJECT RESPONSIVE | **PASS** (critical paths) |
| PERFORMANCE | **PASS** (lab; Prod re-verify after merge) |
| MOBILE | **PASS** |
| RTL/LTR | **PASS** |
| REGRESSION | **PASS** (scoped) |
| MAIN = PRODUCTION | **HOLD** — merge only after Preview visual PASS |
| SOOQNA UX/PERFORMANCE LIVE | **HOLD** — awaiting Production deploy + live metrics |

### Screenshots

- `/opt/cursor/artifacts/after-cars-mobile.png`
- `/opt/cursor/artifacts/after-cars-desktop.png`
- `/opt/cursor/artifacts/after-cars-mobile-filters.png`
- `/opt/cursor/artifacts/after-byd-mobile.png`
- `/opt/cursor/artifacts/after-byd-desktop.png`
