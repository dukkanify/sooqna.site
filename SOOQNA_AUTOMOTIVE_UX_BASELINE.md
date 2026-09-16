# SOOQNA — Automotive UX Baseline (Live Audit)

**Date:** 2026-09-16  
**Domain audited:** https://sooqnauae.com  
**Production SHA:** `9fbd5b3e63c7b5fca166b82d1e31b57daf1274bf`  
**Vercel project:** `sooqna` (`prj_57Tx2amGrhbopE69uXsYPPwcDFLL`)  
**Deployment:** `dpl_5USh35bxrbM592AMVFUEKsWkQLZc`

## Phase 0 — Source of truth

| Field | Value |
|-------|-------|
| CANONICAL DOMAIN | https://sooqnauae.com |
| CANONICAL REPOSITORY | dukkanify/sooqna.site |
| CANONICAL BRANCH | main |
| VERCEL PROJECT | sooqna |
| PRODUCTION SHA | 9fbd5b3e63c7b5fca166b82d1e31b57daf1274bf |
| sooqna.site | DEPLOYMENT_NOT_FOUND (not aliased; do not use) |

## Screenshots

- `/opt/cursor/artifacts/cars-desktop.png`
- `/opt/cursor/artifacts/cars-mobile.png`
- `/opt/cursor/artifacts/byd-desktop.png`
- `/opt/cursor/artifacts/byd-mobile.png`

## Issues found (live)

| Route | Issue | Severity | Expected |
|-------|-------|----------|----------|
| `/listings/byd-song-2019-317` | Gallery used generic car pool → Toyota Land Cruiser-like photos for BYD Song title | Critical | Brand-matched media pool |
| `/categories/cars` | Category hero ~16rem tall; listings pushed below fold | High | Compact hero; results earlier |
| `/listings/byd-song-2019-317` (mobile) | Primary contact CTAs not always above fold | High | Sticky contact bar / visible CTAs |
| `/categories/cars` (mobile) | Dense filter chip rows consume vertical space | Medium | Compact filters / drawer |
| `/categories/cars` | Duplicate location/category chips + sidebar | Medium | Single clear filter surface |
| Catalog | Makes lacked `countryCode` | High | Country on every make |
| Catalog | BYD missing `Song` model (had Song Plus only) | High | Song in Make→Model |
| Search | Vehicle catalog overrides not loaded in smart filters | Medium | Same overrides as create form |
| Env | `NEXT_PUBLIC_APP_URL` still `https://sooqna.site` on live | High (ops) | Set to `https://sooqnauae.com` + redeploy |

## Pre-existing strengths

- Canonical `shared/vehicles/catalog.json` (102 makes / 685+ models)
- Make→Model cascade in create + search
- URL filter persistence (`spec_brand` / `spec_model`)
- Admin enable/disable overrides
- Arabic RTL layout generally correct; no horizontal overflow observed at 390/1280
