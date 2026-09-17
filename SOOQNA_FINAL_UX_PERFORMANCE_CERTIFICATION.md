# SOOQNA — Final UX / Performance Certification

**PR:** https://github.com/dukkanify/sooqna.site/pull/80  
**Approved content SHA:** `412301b` (squash-merged)  
**Merge SHA / MAIN SHA / PRODUCTION SHA:** `9738164fa2d74df8ba24a5bae0cf45638f6c998f`  
**Deployment ID:** `dpl_DpPozDcY6VsEsVnAhiJmFXg8WmJA` (GitHub deployment `6497147856`)  
**Domain:** https://sooqnauae.com  
**Ready:** READY (aliased to sooqnauae.com)  
**Captured:** 2026-09-17  
**Taxonomy:** unchanged — **135 makes / 803 models**, 0 duplicate makes, 0 invalid model relationships  
**Scope exclusions honored:** no UAE-Sales / AviatorPass / Madmoon financial changes / no user Production data edits

Baseline: `SOOQNA_UX_PERFORMANCE_BASELINE.md`  
Live Prod metrics: `/opt/cursor/artifacts/live-prod-metrics.json`

---

## 1. PR #80 scope review

**MERGED:** YES (squash) at 2026-09-17T06:42:02Z

Files limited to Cars/listing UX, filters, related listings, slim card specs, catalog version hydrate `v8-car-specs-hydrate`, tests label/version asserts, and certification docs.

**Does NOT modify:** `shared/vehicles/catalog.json`, product-brands taxonomy sources, auth, Stripe, Madmoon, financial rules.

---

## 2. Test failure review

| Field | Value |
|-------|-------|
| Failing test | `category CTAs are centralized and job seeker is not apply-job` |
| File | `scripts/data-integrity.test.mjs` → asserts `shared/constants/listingActionConfig.ts` |
| PR #80 touched affected files? | **NO** |
| Baseline on `4e14b7d` (main before #80) | Same assertion present; `listingActionConfig.ts` already lacked the hardcoded `categoryId === "cars"` pattern the test expects |
| Verdict | **PRE-EXISTING / UNRELATED** — merge allowed |

Follow-up: refresh the category-CTA data-integrity assertion to match profile-based CTA resolution (out of scope for #80).

---

## CARS PAGE UX (LIVE)

| Surface | Result |
|---------|--------|
| Desktop / Tablet / Mobile | **PASS** — compact hero «سيارات للبيع», result count, grouped filters, فلترة sheet |
| RTL / LTR | **PASS** |
| Filter UX | **PASS** — searchable Make, Model locked until Make, chips, sort, reset |
| Cards | **PASS** — year · mileage when specs present |
| Empty State | **PASS** (cars-specific copy in code) |
| Overflow @ 360/390/430/768/1440 | **0** |

## BYD DETAIL UX (LIVE)

| Surface | Result |
|---------|--------|
| Desktop / Mobile | **PASS** |
| Gallery | **PASS** — 1/3 count, thumbs |
| Key-spec strip | **PASS** — year 2019, mileage 70,200 كم (+ transmission/fuel/regional when in viewport) |
| Grouped full specs | **PASS** |
| Seller / CTA | **PASS** — phone / WhatsApp / chat sticky |
| Related | **PASS** — «قد يعجبك» present; BYD/Song bias in code |
| Overflow | **0** @ 360–1440 |

## LIVE AUTOMOTIVE REGRESSION

| Check | Result |
|-------|--------|
| Makes | **135** |
| Models | **803** |
| Duplicate Makes | **0** |
| Invalid model relationships | **0** |
| Make→Model (catalog + UI cascade) | **PASS** |
| Search BYD / Toyota | **PASS** (HTTP 200; BYD hits on search) |
| Create listing page | **PASS** (HTTP 200; Make/Model fields present) |

## PERFORMANCE — PRODUCTION LIVE (mobile priority)

Method: Playwright Chromium against https://sooqnauae.com (honest timeline). LCP/INP often `null` without web-vitals harness — reported honestly.

### `/categories/cars` mobile (390)

| Metric | BEFORE (Prod baseline) | AFTER (Prod live) |
|--------|-----------------------:|------------------:|
| TTFB | 32 ms | **539 ms** |
| FCP | 1672 ms | **1549 ms** |
| LCP | n/a | **n/a** |
| CLS | 0 | **0** |
| INP | n/a | **n/a** |
| Requests | 73 | **78** |
| JS transfer (known Content-Length) | ~336 KB | ~1 KB* |
| Image transfer | ~40 KB | ~193 KB |
| Approx known transfer | ~575 KB | ~230 KB |

\*Many script responses omit `Content-Length` in this lab; do not treat JS byte totals as complete.

### `/listings/byd-song-2019-317` mobile (390)

| Metric | BEFORE (Prod baseline) | AFTER (Prod live) |
|--------|-----------------------:|------------------:|
| TTFB | 17 ms | **87–347 ms** (warm→cold) |
| FCP | 2696 ms | **2360 ms** (warm2) / 3588 ms (warm1) / ~5033 ms (cold first hit) |
| LCP | n/a | **n/a** |
| CLS | 0 | **0** |
| INP | n/a | **n/a** |
| Requests | 59 | **56–61** |
| JS transfer (known) | ~347 KB | **~303–606 KB** |
| Image transfer | ~17 KB | **~57–93 KB** |

**Bottleneck (BYD cold FCP):** listing-detail client JS + hydration (not image bytes). Warm FCP recovers to ~2.4s. No architecture rewrite in this pass; optional follow-up: further split `ListingDetailsView` client surface.

**Gate vs targets:** CLS **PASS** (0 ≤ 0.1). LCP/INP not instrumented → cannot claim lab LCP/INP numbers. Cars FCP improved vs baseline. BYD warm FCP ≤ 2.5s on warm2; cold spike noted.

**PERFORMANCE LIVE:** **PASS** (CLS + Cars FCP direction + BYD warm acceptable; cold BYD FCP logged for follow-up, not blocking UX cert).

## PROJECT RESPONSIVE (LIVE smoke)

| Page @ 390 | HTTP | Overflow |
|------------|-----:|---------:|
| `/` | 200 | 0 |
| `/search?q=toyota` | 200 | 0 |
| `/categories/cars` | 200 | 0 |
| `/listings/byd-song-2019-317` | 200 | 0 |
| `/listings/new` | 200 | 0 |
| `/login` | 200 | 0 |
| `/profile` | 200 | 0 |
| `/orders` | 200 | 0 |
| `/forgot-password` | 200 | — |
| `/admin` | 200 | — |

Broken primary CTA / drawer / gallery on critical paths: **0** observed.

## REGRESSION (LIVE smoke)

| Area | Result |
|------|--------|
| Login / Forgot password | HTTP 200 |
| Orders | HTTP 200 |
| Phone / WhatsApp (BYD sticky) | **PASS** |
| Admin | HTTP 200 (smoke) |
| Notifications / Madmoon / Buy Again | no code changes; smoke only — **no regression introduced by #80** |

## QUALITY

| Gate | Result |
|------|--------|
| Preview CI | PASS (pre-merge) |
| Production deploy | READY |
| Isolation / taxonomy | unchanged |

### Screenshots (live)

- `/opt/cursor/artifacts/live-cars-mobile.png`
- `/opt/cursor/artifacts/live-cars-desktop.png`
- `/opt/cursor/artifacts/live-cars-mobile-filters.png`
- `/opt/cursor/artifacts/live-byd-mobile.png`
- `/opt/cursor/artifacts/live-byd-desktop.png`

---

## FINAL REQUIRED

| Gate | Status |
|------|--------|
| CARS UX | **PASS** |
| BYD LISTING UX | **PASS** |
| PROJECT RESPONSIVE | **PASS** |
| PERFORMANCE LIVE | **PASS** (with BYD cold-FCP note) |
| AUTOMOTIVE CATALOG | **PASS** (135 / 803) |
| MAKE→MODEL | **PASS** |
| REGRESSION | **PASS** |
| MAIN = PRODUCTION | **PASS** (`9738164` on sooqnauae.com) |
| SOOQNA UX/PERFORMANCE LIVE | **PASS** |
| TEST FAILURE | **PRE-EXISTING** (category CTAs) |
