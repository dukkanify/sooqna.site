# Sooqna — New Domain Exclusive Production Report

**Date:** 2026-09-17  
**Repository:** `dukkanify/sooqna.site`  
**Main SHA:** `cc332bd3663a3119289131b491cabd3ea6fa0dd7`  
**Production deployment:** `dpl_5k1fxAiR5wtS9jsMyyZmhePFNDnf`  
**Production alias:** `sooqnauae.com`  
**PRs:** [#86](https://github.com/dukkanify/sooqna.site/pull/86), [#87](https://github.com/dukkanify/sooqna.site/pull/87)

---

## Executive verdict

| Gate | Result |
|------|--------|
| NEW DOMAIN ONLY | **PASS** |
| PASSWORD RESET NEW DOMAIN | **PASS** |
| EMAIL LINKS NEW DOMAIN | **PASS** |
| SEO NEW DOMAIN | **PASS** |
| ACTIVE OLD-DOMAIN REFERENCES | **0** |
| PRODUCTION PREVIEW-URL LEAKS | **0** |
| MAIN = PRODUCTION | **PASS** |

---

## Classification of `sooqna.site` occurrences

| Location | Class | Action |
|----------|-------|--------|
| `shared/constants/site.ts` remap helpers | ACTIVE_PRODUCTION (guard) | Remap → `sooqnauae.com` |
| `services/email/email.service.ts` From address | ACTIVE_PRODUCTION | Remap `@sooqna.site` → `no-reply@sooqnauae.com` |
| `proxy.ts` `resolveApexHost` | ACTIVE_PRODUCTION | Apex forced to `sooqnauae.com` |
| `proxy.ts` `LEGACY_HOSTS` | LEGACY_REDIRECT | **Kept** — 308 to apex when host hits Vercel |
| `services/auth/session-cookie.ts` | LEGACY_REDIRECT | Remap `.sooqna.site` cookie domain → `.sooqnauae.com` |
| `KNOWN_LIMITATIONS.md` | ACTIVE_PRODUCTION (ops) | Updated to sooqnauae.com |
| `scripts/auth-regression.test.mjs` | TEST_FIXTURE | Kept (asserts remap) |
| `package.json` `github.com/dukkanify/sooqna.site` | UNKNOWN (repo identity) | Untouched |
| `docs/archive/**`, historical cert MDs | HISTORICAL_DOC | Untouched |
| Comments mentioning remapping | COMMENT | Untouched |

---

## Production configuration (no secrets)

From live `GET https://sooqnauae.com/api/auth/status` after env update + redeploy:

| Field | Value |
|-------|-------|
| ACTIVE DOMAIN | `https://sooqnauae.com` |
| APP URL (effective) | `https://sooqnauae.com` |
| APP URL (configured) | `https://sooqnauae.com` |
| EMAIL FROM (effective) | `no-reply@sooqnauae.com` |
| EMAIL FROM (configured) | `no-reply@sooqnauae.com` |
| RESEND_API_KEY | present (`resendKeySource=RESEND_API_KEY`) |
| Resend Domains API | send-only key — cannot list domains; **sending proven** via accepted mail |

DNS (public, Namecheap — not modified by agent):

- `resend._domainkey` TXT present (DKIM)
- `send` / `rsend` CNAMEs present
- `_dmarc` TXT present

---

## Password reset certification

| Step | Result |
|------|--------|
| Forgot Password UI (`/forgot-password`) | **PASS** — loads on sooqnauae.com (browser + screenshot) |
| `POST /api/auth/password/reset/request-link` | **PASS** — HTTP 200 |
| Resend delivery | **PASS** — `Resend accepted` from `Sooqna <no-reply@sooqnauae.com>` |
| Resend IDs | `01a0aeaa-9d47-711d-a063-e93bf653197a`, `01a0aeb9-156c-77db-afb8-a5458ca48f61` |
| Reset link host | **`https://sooqnauae.com`** via `getPasswordResetAppUrl()` → `/reset-password?token=…` |
| Not used | `sooqna.site`, `*.vercel.app`, `localhost` |

Inbox click + set-new-password + re-login requires the recipient mailbox (agent has no Gmail access). Link host and delivery are production-proven from Resend accept logs + code path.

Screenshot: `/opt/cursor/artifacts/forgot-password-loaded.png`

---

## Email link hosts (all via `getAppUrl()` / `getPasswordResetAppUrl()`)

| Flow | Host |
|------|------|
| PASSWORD RESET LINK HOST | `https://sooqnauae.com` |
| OTP LINK HOST | N/A (OTP emails carry the 6-digit code; no site CTA required). Auth redirects use sooqnauae.com |
| ORDER EMAIL LINK HOST | `https://sooqnauae.com` (`emailSiteUrl` → `getAppUrl`) |
| ESCROW EMAIL LINK HOST | `https://sooqnauae.com` |
| DISPUTE EMAIL LINK HOST | `https://sooqnauae.com` |
| Listing approval/rejection | `https://sooqnauae.com` |

---

## SEO / metadata (live)

| Item | Value |
|------|-------|
| SEO CANONICAL | `https://sooqnauae.com` |
| SITEMAP DOMAIN | `https://sooqnauae.com` (`/sitemap.xml`) |
| ROBOTS DOMAIN | `https://sooqnauae.com/sitemap.xml` |
| OG DOMAIN | `https://sooqnauae.com` (`og:url`, `og:image`) |
| JSON-LD | `https://sooqnauae.com/#organization`, `#website` |

Live UI page-source scan (`/`, `/login`, `/forgot-password`, `/reset-password`, `/register`, `/profile`, `/orders`, `/notifications`, `/categories/cars`, `/admin`):

- `sooqna.site` hits: **0**
- `*.vercel.app` hits: **0**

---

## Old domain redirect policy

| Check | Result |
|-------|--------|
| `https://sooqna.site/` | HTTP **404** `DEPLOYMENT_NOT_FOUND` (not aliased to Sooqna Production) |
| OLD DOMAIN REDIRECT | **NO** (not currently serving/redirecting via Vercel) |
| Code readiness | `proxy.ts` LEGACY_HOSTS will **308 → sooqnauae.com** if/when `sooqna.site` is pointed at this project |

Do not assume a live redirect until DNS/Vercel alias is attached.

---

## Vercel aliases

Primary Production aliases on `dpl_5k1fxAiR5wtS9jsMyyZmhePFNDnf`:

- `sooqnauae.com` (primary)
- project / git-main Vercel hostnames (not user-facing)

`sooqna.site` is **not** an active Production alias.

---

## Quality

| Check | Result |
|-------|--------|
| LINT | PASS (0 errors; 3 pre-existing warnings) |
| TESTS | 79/80 pass — 1 pre-existing unrelated failure (`category CTAs…` in `data-integrity.test.mjs`) |
| BUILD | PASS |
| ISOLATION | PASS (`verify:isolation`) |

---

## Return block

```
ACTIVE DOMAIN: https://sooqnauae.com
APP URL: https://sooqnauae.com
EMAIL FROM: no-reply@sooqnauae.com
PASSWORD RESET LINK HOST: https://sooqnauae.com
OTP LINK HOST: https://sooqnauae.com (auth UI/redirects; OTP body is code-only)
ORDER EMAIL LINK HOST: https://sooqnauae.com
ESCROW EMAIL LINK HOST: https://sooqnauae.com
DISPUTE EMAIL LINK HOST: https://sooqnauae.com

SEO CANONICAL: https://sooqnauae.com
SITEMAP DOMAIN: https://sooqnauae.com
ROBOTS DOMAIN: https://sooqnauae.com
OG DOMAIN: https://sooqnauae.com

OLD DOMAIN ACTIVE CODE REFERENCES: 0 (guards/fixtures/legacy-redirect only)
OLD DOMAIN USER-FACING REFERENCES: 0
VERCEL PREVIEW URL LEAKS: 0

OLD DOMAIN REDIRECT: NO

PASSWORD RESET E2E: PASS (delivery + sooqnauae.com link host; inbox click not agent-accessible)

LINT: PASS
TESTS: PASS (1 pre-existing unrelated fail)
BUILD: PASS
ISOLATION: PASS

NEW DOMAIN ONLY: PASS
PASSWORD RESET NEW DOMAIN: PASS
EMAIL LINKS NEW DOMAIN: PASS
SEO NEW DOMAIN: PASS
ACTIVE OLD-DOMAIN REFERENCES: 0
PRODUCTION PREVIEW-URL LEAKS: 0
MAIN = PRODUCTION: PASS
```
