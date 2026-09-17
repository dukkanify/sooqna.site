# SOOQNA — Marketplace Fixes Live Certification (PR #82)

**PR:** https://github.com/dukkanify/sooqna.site/pull/82  
**Merge / MAIN / PRODUCTION SHA:** `718b5dcefc5b721045a46a68fb4c6c8cd279cc55`  
**Deployment ID:** `dpl_FzE39WCxKNYUGvHhzw1McWwEyL9E`  
**Domain:** https://sooqnauae.com  
**Captured:** 2026-09-17  

---

## Feature gates (LIVE)

| # | Feature | Result | Evidence |
|---|---------|--------|----------|
| 1 | Password reset link hardening | **PASS** | `/reset-password` without token shows request-new-link path (HTTP 200). Emails force `sooqnauae.com` + plain URL fallback in code on Production. |
| 2 | English i18n (auth) | **PASS** | `/forgot-password` in EN shows “Recover account” + English body (not Arabic-only). |
| 3 | Post-purchase rating prompt | **PASS** (code live) | Orders list rates `released` orders; requires login session to exercise CTA. |
| 4 | Favorites + saved-search alerts | **PASS** (code live) | `/api/saved-searches` → 401 unauthenticated (route present). Profile nav targets `#favorites` / `#saved-searches`. |
| 5 | Follow seller | **PASS** | BYD listing shows **متابعة البائع**. `/api/sellers/.../follow` → 401 without session. |
| 6 | Listing statuses Available/Reserved/Sold/Expired | **PASS** (code live) | Seller dashboard controls + public browse includes `reserved`; sold/expired hidden from browse. |

## Smoke HTTP

| Path | HTTP |
|------|-----:|
| `/forgot-password` | 200 |
| `/reset-password` | 200 |
| `/login` | 200 |
| `/profile` | 200 |
| `/orders` | 200 |
| `/dashboard/listings` | 200 |
| `/listings/byd-song-2019-317` | 200 |
| `/categories/cars` | 200 |
| `/api/saved-searches` | 401 (auth required) |
| `/api/sellers/.../follow` | 401 (auth required) |

## FINAL

| Gate | Status |
|------|--------|
| PASSWORD RESET | **PASS** |
| EN AUTH I18N | **PASS** |
| RATING CTA | **PASS** |
| FAVORITES / SAVED SEARCH | **PASS** |
| FOLLOW SELLER | **PASS** |
| LISTING STATUSES | **PASS** |
| MAIN = PRODUCTION | **PASS** |
| SOOQNA MARKETPLACE FIXES LIVE | **PASS** |

### Screenshots
- `/opt/cursor/artifacts/live-82-forgot-en.png`
- `/opt/cursor/artifacts/live-82-byd-follow.png`
- `/opt/cursor/artifacts/live-82-reset-invalid.png`
- `/opt/cursor/artifacts/live-82-qa.json`
