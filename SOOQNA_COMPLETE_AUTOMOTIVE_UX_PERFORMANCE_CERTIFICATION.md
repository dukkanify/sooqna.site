# SOOQNA — Complete Automotive UX / Performance Certification

**Date:** 2026-09-16  
**Baseline:** `SOOQNA_AUTOMOTIVE_UX_BASELINE.md`  
**Shipped:** PR #69 (catalog/countries/UX) + PR #70 (BYD Song real media)

## PRODUCTION

| Field | Value |
|-------|-------|
| Canonical domain | https://sooqnauae.com |
| Repository | dukkanify/sooqna.site |
| Branch | main |
| Main SHA | `f4ce6d36250e1ac49f993bcbe13af1f2d27cce74` |
| Production SHA | `f4ce6d36250e1ac49f993bcbe13af1f2d27cce74` |
| Vercel project | sooqna (`prj_57Tx2amGrhbopE69uXsYPPwcDFLL`) |
| Deployment ID | `dpl_4VbTzc6WqSRu4g3hfvuT2wM8FVbh` |
| sooqna.site | Not aliased / separate from sooqnauae.com |

**MAIN = PRODUCTION:** PASS (SHA match verified live)

## AUTOMOTIVE DATA

| Metric | Value |
|--------|------:|
| Total Makes | 102 |
| Makes with Country | 102 |
| Total Models | 686 (includes BYD Song) |
| Oldest supported Year | 1990 (dynamic options) |
| Newest supported Year | current calendar year |
| Duplicate Makes | 0 |
| Duplicate Models | 0 |
| Invalid Relationships | 0 |
| Manual Review | Free-text / ambiguous aliases only |

## CARS FORM

| Check | Status |
|-------|--------|
| Make | PASS (catalog-backed) |
| Model | PASS (Make→Model cascade) |
| Make→Model dependency | PASS |
| Years | PASS (dynamic) |
| Country | PASS (admin/reference; not crowded into public filters) |
| Attributes | PASS (existing category fields) |
| Edit flow | PASS (same catalog source) |

## CARS FILTERS

| Filter | Status |
|--------|--------|
| Make / Model | PASS + cascade clear |
| Year / Price / Mileage | PASS (URL-persisted) |
| Condition / Body / Transmission / Fuel / Drivetrain / Color | PASS (existing schema) |
| Emirate / Area | PASS + cascade |
| URL persistence | PASS |
| Reset | PASS |
| Sorting | PASS (newest / price) |

## CARS PAGE UX

| Surface | Status |
|---------|--------|
| Desktop | PASS (live 137 listings, filters usable) |
| Tablet | PARTIAL (spot-checked) |
| Mobile | PARTIAL (filter button OK; full bottom-sheet redesign deferred) |
| Arabic RTL | PASS |
| English LTR | PASS (catalog EN names) |

## BYD LISTING (`/listings/byd-song-2019-317`)

| Check | Status |
|-------|--------|
| Data integrity | PASS — Make BYD / Model Song / Year 2019 |
| Media | **PASS (live)** — local Wikimedia Song Plus EV; NOT Tesla |
| CTA | PASS (Contact / Phone / WhatsApp) |
| Responsive | PASS (desktop + mobile sticky bar) |
| Performance | PARTIAL — hero asset ~113KB; HTML TTFB ~0.2s (no full Lighthouse lab run) |

### Media hotfix note
PR #69 introduced a `byd_suv` pool, but Unsplash IDs were Tesla/Hyundai.  
PR #70 replaced them with `/media/vehicles/byd/byd-song-plus-ev-champion-edition-00{1,2,3}.jpg` (CC BY-SA).

## PROJECT RESPONSIVE

| Check | Status |
|-------|--------|
| Pages audited | Cars, BYD listing, Home (spot) |
| Widths audited | ~390, ~1280 (live) |
| Horizontal overflow | 0 on audited pages |
| Broken CTAs / forms / galleries | 0 on audited pages |
| Full width matrix (320→1440 all routes) | PARTIAL — not claimed complete |

## PERFORMANCE — CARS (live smoke, not Lighthouse)

| Metric | Value |
|--------|-------|
| HTTP | 200 |
| TTFB (sample) | ~0.2–1.0s |
| Transfer HTML | ~480KB |
| LCP / CLS / INP | Not lab-measured this run |

## PERFORMANCE — BYD LISTING (live smoke)

| Metric | Value |
|--------|-------|
| HTTP | 200 |
| TTFB (sample) | ~0.21s |
| Transfer HTML | ~262KB |
| Hero asset | 112804 bytes, ~50ms |
| LCP / CLS / INP | Not lab-measured this run |

## REGRESSION

Auth / Password Reset / Orders / Buy Again / Notifications / Admin / Madmoon / RBAC: not re-broken by media/catalog changes (no code paths touched). Full suite: 1 pre-existing unrelated test fail remains.

## QUALITY

| Gate | Status |
|------|--------|
| vehicle-catalog tests | PASS (12/12) |
| Lint / Build | Via Vercel production READY |
| Isolation | Not re-run this hotfix |
| Playwright | Not re-run this hotfix |

## ABSOLUTE GATE (honest)

| Gate | Result |
|------|--------|
| SOOQNA AUTOMOTIVE DATA | PASS |
| ALL SUPPORTED MAKES | PASS (102 catalog) |
| MAKE → MODEL | PASS |
| COUNTRY DATA | PASS |
| YEARS | PASS |
| CREATE/EDIT LISTING | PASS (shared catalog) |
| SMART CARS FILTERS | PASS |
| CARS UX | PARTIAL |
| BYD LISTING UX | **PASS** (media fixed live) |
| PROJECT RESPONSIVE | PARTIAL |
| PERFORMANCE | PARTIAL (smoke only) |
| REGRESSION | PASS (scoped) |
| MAIN = PRODUCTION | **PASS** |
| SOOQNA LIVE INTEGRATED | **PASS** for shipped scope |

**Do not claim full 50-phase PRODUCTION READY.** Critical live blockers for BYD media and catalog country/Song coverage are closed on sooqnauae.com at SHA `f4ce6d3`.

### Ops reminder
Production env still may have `NEXT_PUBLIC_APP_URL` / email from-address on legacy `sooqna.site` — owner update recommended; not blocking BYD media.
