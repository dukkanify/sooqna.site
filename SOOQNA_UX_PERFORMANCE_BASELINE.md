# SOOQNA — UX / Performance Baseline (BEFORE)

**Captured:** 2026-09-17  
**Source:** https://sooqnauae.com (live Production)  
**Method:** Playwright Chromium Performance Timeline (honest). LCP/INP may be `null` when the browser does not emit buffered LCP without a full web-vitals lab harness — FCP/TTFB/transfer/request counts are recorded.

## Critical pages

### `/categories/cars`

| Metric | Mobile (390) | Desktop (1440) |
|--------|-------------:|---------------:|
| HTTP | 200 | 200 |
| TTFB | 32 ms | 73 ms |
| FCP | 1672 ms | 1604 ms |
| LCP | n/a (buffered LCP empty) | n/a |
| CLS | 0 | 0 |
| INP | n/a (no interaction lab) | n/a |
| Doc transfer | ~35.8 KB | ~36.9 KB |
| Requests | 73 | 73 |
| JS transfer | ~336 KB | ~336 KB |
| CSS transfer | ~151 KB | ~151 KB |
| Image transfer | ~40 KB | ~40 KB |
| Total approx | ~575 KB | ~576 KB |

### `/listings/byd-song-2019-317`

| Metric | Mobile (390) | Desktop (1440) |
|--------|-------------:|---------------:|
| HTTP | 200 | 200 |
| TTFB | 17 ms | 61 ms |
| FCP | 2696 ms | 1328 ms |
| LCP | n/a | n/a |
| CLS | 0 | 0 |
| INP | n/a | n/a |
| Doc transfer | ~25.9 KB | ~25.7 KB |
| Requests | 59 | 58 |
| JS transfer | ~347 KB | ~347 KB |
| CSS transfer | ~140 KB | ~140 KB |
| Image transfer | ~17 KB | ~17 KB |
| Total approx | ~542 KB | ~542 KB |

## Sample pages (smoke)

| Page | Mobile FCP | Desktop FCP | Requests | Approx transfer |
|------|-----------:|------------:|---------:|----------------:|
| Home `/` | 384 ms | 340 ms | 122 | ~734 KB |
| Search `?q=toyota` | 840 ms | 820 ms | 65 | ~519 KB |

## UX baseline notes (visual)

- Cars page: large hero card + subcategory pills + dense desktop sidebar still shows full field wall (mobile sheet already essentials + «المزيد»).
- Listing cards: title → price → location; year/mileage not scannable on cards.
- BYD detail: gallery strong; map sits above description; full specs not grouped; mobile sticky CTA present.
- No taxonomy changes in this pass.

## Screenshots

- `/opt/cursor/artifacts/baseline-cars-mobile.png`
- `/opt/cursor/artifacts/baseline-cars-desktop.png`
- `/opt/cursor/artifacts/baseline-byd-mobile.png`
- `/opt/cursor/artifacts/baseline-byd-desktop.png`

Raw JSON: `/opt/cursor/artifacts/baseline-metrics.json`
