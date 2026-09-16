# SOOQNA — Complete Automotive UX / Performance Certification

**Date:** 2026-09-16  
**Branch:** `cursor/automotive-complete-cert-f438`  
**Baseline:** `SOOQNA_AUTOMOTIVE_UX_BASELINE.md`

## PRODUCTION (pre-merge baseline)

| Field | Value |
|-------|-------|
| Canonical domain | https://sooqnauae.com |
| Repository | dukkanify/sooqna.site |
| Branch | main |
| Main SHA (at audit) | `9fbd5b3e63c7b5fca166b82d1e31b57daf1274bf` |
| Vercel project | sooqna |
| Deployment ID (at audit) | `dpl_5USh35bxrbM592AMVFUEKsWkQLZc` |
| sooqna.site | Not aliased / DEPLOYMENT_NOT_FOUND |

## AUTOMOTIVE DATA (this change)

| Metric | Value |
|--------|------:|
| Total Makes | 102 |
| Makes with Country | 102 |
| Total Models | 686 (+ Song) |
| Duplicate Make slugs | 0 |
| Duplicate Model keys | 0 |
| Invalid relationships | 0 |
| Manual Review | Free-text brands still `MANUAL_REVIEW` via aliases |

### Delivered in this PR

- Country of origin on every make (`countryCode` / EN / AR)
- BYD **Song** model added
- BYD-specific listing media pool (fixes Toyota-like covers on BYD Song)
- Compact category hero (cars results appear earlier)
- Search smart filters load vehicle-catalog overrides (parity with create)
- `getBrandOptionsForCategory("cars")` uses live `vehicleMakeOptions()`
- Admin catalog shows country of origin
- Integrity tests for country + Song + BYD media hint

### Still open (not claimed PASS)

- Full mobile filter bottom-sheet redesign
- Measured LCP/CLS/INP BEFORE/AFTER on live (needs post-deploy Lighthouse)
- `NEXT_PUBLIC_APP_URL` / email from-address still `sooqna.site` in Production env (owner ops)
- Listing FK to makeId/modelId (still English string specs)
- Range Rover remains a separate make row (aliased UX still maps)
- Pre-existing unrelated test fail: `category CTAs are centralized…` (listingActionConfig profile refactor)

## CARS FORM / FILTERS

| Check | Status |
|-------|--------|
| Make → Model create | PASS (existing + catalog Song) |
| Make → Model search | PASS + overrides loaded |
| URL persistence | PASS (existing) |
| Years | PASS (dynamic yearOptions from 1990→current) |
| Country in admin | PASS |
| Country as public filter | Not exposed (kept reference/admin; avoid clutter) |

## CARS / BYD UX

| Check | Status |
|-------|--------|
| Compact cars hero | PASS (code) |
| BYD media integrity | PASS (code + regex) |
| Mobile sticky contact | Existing sticky bar; live re-verify after deploy |
| Desktop price in sticky panel | Existing |

## QUALITY

| Gate | Status |
|------|--------|
| vehicle-catalog tests | PASS (11/11 file; 66+ related) |
| Full npm test | 1 pre-existing unrelated fail |
| ESLint (touched files) | PASS |
| Build | (run in CI / local before merge) |

## ABSOLUTE GATE (honest)

| Gate | Result |
|------|--------|
| SOOQNA AUTOMOTIVE DATA | **PASS** (catalog completeness + country + Song) |
| MAKE → MODEL | **PASS** |
| COUNTRY DATA | **PASS** |
| CREATE/EDIT LISTING | **PASS** (same catalog) |
| SMART CARS FILTERS | **PASS** (cascade + overrides) |
| CARS UX | **PARTIAL** (hero compact; filter drawer redesign deferred) |
| BYD LISTING UX | **PARTIAL** (media fixed; full LCP measurement post-deploy) |
| PROJECT RESPONSIVE | **PARTIAL** (spot-checked; not full width matrix) |
| PERFORMANCE | **PARTIAL** (no fabricated Lighthouse numbers) |
| MAIN = PRODUCTION | Verify after merge deploy |
| LIVE INTEGRATED | Pending Production SHA match after merge |

**Do not claim full PRODUCTION READY for all 50 phases.** This PR closes critical data-integrity and catalog gaps identified in the live baseline.
