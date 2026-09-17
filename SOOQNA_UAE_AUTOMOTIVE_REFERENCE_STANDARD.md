# SOOQNA — UAE Current Automotive Reference Standard

**Date:** 2026-09-16  
**Branch:** `cursor/uae-automotive-reference-f438`  
**Scope:** Current UAE/GCC marketplace catalog — not exhaustive world history.

## Acceptance

| Field | Result |
|-------|--------|
| UAE-RELEVANT MAKES | **135** active (Dubizzle-benchmark expansion 2026-09-17; see `SOOQNA_UAE_MAKE_DUBIZZLE_COVERAGE_REPORT.md`) |
| UAE-RELEVANT MODELS | **803** |
| CURRENT MODELS COVERED | PASS (e.g. Toyota Raize/Urban Cruiser/GR86, Nissan Z/X-Terra, BYD Qin/Atto 3/Song) |
| COMMON USED MODELS COVERED | PASS (Patrol, Land Cruiser, Camry, C/E/S-Class, X5, etc.) |
| COUNTRY METADATA | PASS (every make has countryCode / EN / AR) |
| REGIONAL SPECS | PASS — خليجي / أمريكي / كندي / أوروبي / ياباني / كوري / أخرى |
| YEAR RANGE | PASS — dynamic **1990 → current+1** via `vehicleYearOptions()` |
| MAKE→MODEL | PASS (create, edit, search filters, admin) |
| CREATE LISTING | PASS (shared catalog + modelOther suggestion) |
| EDIT LISTING | PASS (same fields/catalog) |
| CARS FILTER | PASS (brand/model/year/condition/regionalSpecs/body/transmission/fuel/drivetrain) |
| ADMIN MANAGEMENT | PASS (activate/deactivate makes/models; option suggestions queue) |
| MOBILE | PASS (searchable combobox; model loads after make) |
| ARABIC | PASS |
| ENGLISH | PASS (phrases for regional/body/drivetrain) |

### Required gates

- UAE AUTOMOTIVE CATALOG: **PASS**
- MAKE → MODEL: **PASS**
- CURRENT UAE MARKET COVERAGE: **PASS**
- COMMON USED MARKET COVERAGE: **PASS**
- REGIONAL SPECS: **PASS**
- SINGLE DATA SOURCE: **PASS** (`shared/vehicles/catalog.json` + overrides)
- CATEGORIES/FORMS/FILTERS CONSISTENT: **PASS**

## Changes in this pass

1. Centralized `shared/vehicles/year-options.ts` (years + regional/body/drivetrain/fuel/transmission options).
2. Cars form: `modelOther` → admin option-suggestions; expanded regional specs; body/drivetrain; richer fuel/transmission.
3. Cars search filters include regionalSpecs, condition, bodyType, drivetrain.
4. Catalog regen: Toyota Raize / Urban Cruiser / GR86 / 86; Nissan Z / X-Terra / 370Z / 350Z; Honda Elevate; BYD Qin.
5. Live seed regionalSpecs normalized to canonical option values.
6. Import remains: `node scripts/import-vehicle-catalog.mjs [--dry-run] [--regenerate]`.
