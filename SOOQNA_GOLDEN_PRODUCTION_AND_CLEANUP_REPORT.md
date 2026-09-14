# SOOQNA GOLDEN PRODUCTION AND CLEANUP REPORT

**Date:** 2026-09-14  
**Canonical repository:** `dukkanify/sooqna.site`  
**Canonical branch:** `main`  
**Production:** https://sooqna.site  
**Vercel project:** `sooqna`  
**Cloud agent:** https://cursor.com/agents/bc-acaf72a1-3792-43db-b3b9-ffcc85f1f438  

This lock was proven before any cleanup. AviatorPass was not touched. UAE-Sales was not used. Production database was not reset. No real users, listings, media, transactions, notifications, disputes, or audit trails were deleted.

---

## CANONICAL

| Field | Value |
|---|---|
| CANONICAL REPOSITORY | `dukkanify/sooqna.site` |
| CANONICAL BRANCH | `main` |
| GOLDEN MAIN SHA | `e5b2bbf4c885160bd9c341fcb8cfef00d449756a` |
| PRODUCTION SHA | `e5b2bbf4c885160bd9c341fcb8cfef00d449756a` |
| DEPLOYMENT ID | `6434363276` (GitHub Production deployment) |
| PREVIEW DEPLOYMENT ID | `6434359086` |
| PREVIEW URL | https://sooqna-7umjui6qx-dukkanify-technology-llcs-projects.vercel.app |
| DOMAIN | https://sooqna.site |

Production SHA equals Golden Main SHA. Preview SHA equals the same commit.

---

## PHASE 1 — PASSWORD RESET FIX (code-proven, not title-guessed)

A previous bug: Forgot Password → Reset Password → login with the new password failed because the hash was not durably persisted before the reset token was consumed / before login read it.

**PASSWORD RESET FIX**

| Field | Value |
|---|---|
| Commit/PR | Squash `adb33213524250ca38e8f3ec64497176c4dcb876` — [PR #3](https://github.com/dukkanify/sooqna.site/pull/3) (`cursor/fix-password-reset-login-9223`) |
| Title | `fix: password reset must persist to Postgres before login succeeds` |
| Merged | 2026-09-14T05:59:56Z |
| In main | **YES** (`git merge-base --is-ancestor adb3321 origin/main`) |
| In Production | **YES** (Production SHA `e5b2bbf` contains `adb3321`) |
| Superseded | **NO**. No later commit on `main` after `adb3321` touches reset confirm, password login, `user-persistence.ts`, or `password-reset-token.ts`. |

**Behavior verified in the golden tree (not inferred from the commit subject):**

1. `POST /api/auth/password/reset/confirm` resolves the token **without burning it**.
2. `requireDurableAuthStore()` refuses `/tmp` emergency mirror (503 `AUTH_STORE_NOT_DURABLE`). Durable Postgres **or** durable local JSON is required.
3. `setUserPassword` writes the new hash (`passwordUpdatedAt` + `sessionVersion++`).
4. The user is reloaded and `verifyPassword(newPassword, reloaded.passwordHash)` must succeed **before** `markPasswordResetTokenConsumed(jti)`.
5. Session cookie is cleared after a successful reset.
6. Login trims email/password, rejects `PASSWORD_NOT_SET`, and `reconcileFromMirrorIfNeeded` heals a stale Postgres hash from a newer emergency-mirror hash when that is the only split-brain case.

Leftover branch `cursor/fix-password-reset-login-9223` unique commits (`c9034a5`, `26c3519`) were squash-equivalent: confirm-route diff vs `main` was empty. **MUST_RECOVER: NO.**

---

## PHASE 2 — PASSWORD RESET E2E (LIVE, not inherited)

Controlled fresh QA users (not demo accounts). Sequence 1–15 executed over HTTP against the live origin, with OTP and reset token taken from the actual Resend emails (mail.tm inbox).

### LIVE Production — https://sooqna.site

QA user `user-1789379457956-d26c9db2` (fresh register). Persistence: Postgres `auth_users`, durable, not degraded.

| Step | Result |
|---|---|
| 1 Register fresh user | PASS (email delivered) |
| 2 Receive OTP | PASS |
| 3 Verify account | PASS (`approved: true`) |
| 4 Login original password | PASS (same user id) |
| 5 Logout | PASS |
| 6 Forgot Password | PASS |
| 7 Receive reset email | PASS (signed token delivered) |
| 8 Open valid reset link | PASS (`GET /api/auth/password/reset/confirm?token=` → 200) |
| 9–10 Set NEW password + success | PASS |
| Token reused after success | PASS (400 `INVALID_TOKEN`) |
| 11 Login OLD password | PASS — **FAILS as required** (401 `INVALID_CREDENTIALS`) |
| 12 Login NEW password | PASS (same user id, still verified) |
| 13 Logout | PASS |
| 14 Login NEW password again | PASS |
| 15 New session NEW password | PASS |
| Re-register same email | PASS — 409 `EMAIL_ALREADY_REGISTERED` (no duplicate auth user) |

Server/database observations from live behavior:

- Correct auth user updated (same `userId` before and after reset).
- Password hash updated once (old password rejected, new accepted).
- Reset token invalidated after use.
- Old password no longer valid.
- Account remained verified (`emailVerifiedAt` preserved).
- No duplicate auth user.
- No stale session: logout + empty cookie jar still accepted the new password.

**PASSWORD RESET → NEW PASSWORD LOGIN: PASS**

### Cloud Preview (same golden SHA)

Preview origin: `https://sooqna-7umjui6qx-dukkanify-technology-llcs-projects.vercel.app`  
QA user `user-1789379503923-87a5d659`. Same 1–15 sequence: **PASS**.

---

## PHASE 3 — FEATURE RECOVERY INVENTORY

No required feature exists only outside `main`. Cleanup was allowed to proceed.

| Feature | Source commit/PR | MAIN | PRODUCTION |
|---|---|---|---|
| Password reset/login fix | PR #3 `adb3321` | YES | YES |
| Marketplace CTA | `listingActionConfig` / `fix/listing-intent-ctas` (ancestor of main) | YES | YES |
| Phone/WhatsApp | `listing-contact.ts` + listing sticky/primary action | YES | YES |
| Purchase eligibility | PR #1 `fix/marketplace-purchase-eligibility` | YES | YES |
| Smart filters | PR #8 `eabc032` + `c6f3f49` | YES | YES |
| Admin dashboard redesign | PR #2 `feature/admin-dashboard-redesign` | YES | YES |
| Madmoon verification | `requiresProductConditionVerification` in `shared/listings/escrow-eligibility.ts` (no live named Madmoon branch) | YES | YES |
| Notifications / deep links | `/notifications`, bell, `public/sw.js`, hrefs on `/orders/…` and `/listings/…` | YES | YES |
| Mobile logout | PR #4 squash `6fdaef6` — chip + `lg:hidden` under-content button in `DashboardShell` | YES | YES |
| Auth / login contrast | PR #5 squash `d680f78` | YES | YES |
| 26 requirement fixes | `qa/26-homepage-copy-fixes` ancestor + `docs/SOOQNA_26_ISSUES_TRACEABILITY.md` | YES (code) | YES (code; not every of the 26 UI cases was re-run this lock) |
| Responsive / listing detail UX | sticky bar + current listing detail on main | YES | YES |

**MUST_RECOVER: none.**

Open PR **#7** `cursor/add-cloud-env-76f4` is Cloud Agent `environment.json` only — KEEP, not product recovery.

UNKNOWN leftover: `cursor/cloud-agent-1789220497826-047vw` is older than smart filters and was **not** merged (would regress). Not recovered.

---

## PHASE 4 — GOLDEN MAIN

`origin/main` already contained every approved required fix. No recover-merge was required. No force-push.

**GOLDEN MAIN SHA:** `e5b2bbf4c885160bd9c341fcb8cfef00d449756a`

---

## PHASE 5 — QUALITY GATES (golden candidate)

| Gate | Result |
|---|---|
| `npm run lint` | **PASS** |
| `npm test` | **PASS** (26/26) including password-reset unit regression |
| `npm run build` | **PASS** |
| `npm run verify:isolation` | **PASS** (no AviatorPass traces) |

Unrelated historical warning (not a gate fail): Turbopack NFT warning `next.config.ts` → `services/payments/data-store.ts` during `next build`.

Owner config (not a missing code fix): Production `/api/auth/status` still reports `cronSecretConfigured: false` / missing `CRON_SECRET`. Unauthorized cron returns 503 `CRON_SECRET_REQUIRED` until the owner sets the secret in Vercel. **Do not invent `CRON_SECRET`.**

---

## PHASE 6 — CLOUD PREVIEW CERTIFICATION

Preview deployment `6434359086` source SHA `e5b2bbf` matches golden. Public (no Vercel Authentication wall). Persistence Postgres durable. Resend configured.

| Area | Result |
|---|---|
| AUTH register → OTP → verify → login → logout → login | PASS (fresh QA user) |
| PASSWORD RESET old fail / new pass / second login | PASS |
| Marketplace search / category / smart filters URLs | PASS |
| Listing detail CTA + Phone + WhatsApp | PASS on Production listing pages (same SHA) |
| Admin dashboard / users / listings / RBAC | PASS on Production (same SHA; demo admin + 403 for demo user) |
| Madmoon/escrow page | PASS |
| Notifications page + API persistence | PASS (empty history for demo user is valid; href builders remain `/orders/…` and `/listings/…`) |
| Responsive (code + listing sticky bar present) | PASS |

No critical FAIL on Preview auth/reset.

---

## PHASE 7–8 — PRODUCTION DEPLOY AND LIVE CERTIFICATION

No additional Production deploy was required: Vercel Production was already on the golden SHA (`6434363276`, environment Production, 2026-09-14T09:39:56Z).

LIVE https://sooqna.site re-run (not inherited):

| Check | Result |
|---|---|
| Register/Verify/Login | PASS |
| Password Reset | PASS |
| Old Password Rejected | PASS |
| New Password Login | PASS |
| Second New Password Login | PASS |
| New browser/session (empty cookie jar) | PASS |
| Marketplace CTA | PASS |
| Phone/WhatsApp | PASS (`tel:` + `wa.me` on live listing details, e.g. `/listings/showcase-apartment-sale-marina`) |
| Purchase eligibility | PASS (code + CTA engine; Buy Now only via `isPurchasableListing`) |
| Smart Filters | PASS (`/search?category=cars&spec_make=Toyota&spec_model=Camry`) |
| Admin Dashboard / Users / Listings / RBAC | PASS (admin 200 dashboard JSON with permissions; non-admin GET `/api/admin/dashboard/summary` → 403 `FORBIDDEN`) |
| Madmoon | PASS (escrow page + `requiresProductConditionVerification`) |
| Notifications | PASS (page + API; deep-link hrefs in services) |
| Search / listing pages | PASS |
| Project isolation | PASS |

---

## PHASE 9–10 — DUKKANIFY BACKUP

Created only after LIVE Production password-reset and feature certification of SHA `e5b2bbf`.

| Field | Value |
|---|---|
| BACKUP TAG | `dukkanify-sooqna-golden-20260914` (annotated) |
| BACKUP BRANCH | `backup/dukkanify-golden-20260914` |
| BACKUP SHA | `e5b2bbf4c885160bd9c341fcb8cfef00d449756a` |
| Verified | **YES** — tag peel and backup branch both equal Production/golden SHA |

Backup contains the auth reset/login fix, all approved features listed above, current source, and Git-safe configuration. **No Vercel secret values were copied into Git.**

The backup is emergency rollback/reference only. Canonical source remains `dukkanify/sooqna.site` `main`.

Historical tag `ismail-اسماعيل` was kept (not deleted).

---

## PHASE 11 — DATA SAFETY

| Item | Result |
|---|---|
| Production DB changed destructively | **NO** |
| Real users deleted | **0** |
| Real listings deleted | **0** |
| Transactions deleted | **0** |

Fresh QA accounts were **created** (register + reset) and left in place. Demo accounts were used only for admin/RBAC/notification smoke.

---

## PHASE 12 — DOCUMENTATION ARCHIVE

Historical root reports/audits/acceptance notes were moved with `git mv` to `docs/archive/` (not deleted).

| | Count |
|---|---|
| Archived | **74** Markdown files + `docs/archive/README.md` |
| Deleted documents | **0** |

Kept at repository root as active/operational docs: `README.md`, `AGENTS.md`, `BRAND_MIGRATION_REPORT.md`, `STRIPE_GO_LIVE.md`, `STRIPE_WEBHOOK_SETUP.md`, `PRODUCTION_DEPLOYMENT_GUIDE.md`, `TESTING_GUIDE.md`, `KNOWN_LIMITATIONS.md`, `ARCHITECTURE.md`, `FRONTEND_STRUCTURE.md`, `API_INTEGRATION_GUIDE.md`, `DESIGN_SYSTEM.md`, `BRAND_IDENTITY_GUIDE.md`, `UI_STYLE_GUIDE.md`, `ESCROW_PAYMENT_MODEL.md`, `PAYMENT_FLOW_DOCUMENTATION.md`, `CLOSED_BETA_PLAN.md`, `BETA_FEEDBACK_FORM.md`, `SOOQNA_PERFORMANCE_BASELINE.md`, `DESIGN_DECISIONS.md`, plus `docs/design-system.md` and `docs/SOOQNA_26_ISSUES_TRACEABILITY.md`.

This golden report remains at the repository root.

`README.md` link to the email-notifications report was retargeted to `docs/archive/`.

---

## PHASE 13 — BRANCH CLEANUP

Performed only after golden main, Production, and backup tag/branch were verified.

**Before (origin branches):** 17  
**Deleted:** 13  
**Remaining origin branches after cleanup + this PR branch:** see below.

### SAFE_DELETE list (printed before deletion, then deleted)

- `cursor/smart-category-search-filters-f438` (ancestor of main / PR #8)
- `cursor/final-consolidation-report-f438` (ancestor of main / PR #9)
- `feature/admin-dashboard-redesign` (ancestor of main / PR #2)
- `fix/listing-intent-ctas` (ancestor of main)
- `fix/marketplace-purchase-eligibility` (ancestor of main / PR #1)
- `integrity/final-delivery` (ancestor of main)
- `ismail-اسماعيل` (**branch only**; tag kept)
- `perf/production-optimization` (ancestor of main)
- `qa/26-homepage-copy-fixes` (ancestor of main)
- `cursor/mobile-logout-visibility-9223` (PR #4 squash leftover)
- `cursor/source-of-truth-inventory-f438` (PR #6 squash leftover)
- `cursor/fix-password-reset-login-9223` (PR #3 squash leftover; confirm route identical to main)
- `cursor/fix-login-clarity-f438` (PR #5 squash leftover; leftover tree lacked later smart-filter work)

### UNKNOWN (not deleted)

- `cursor/cloud-agent-1789220497826-047vw` — older tree missing later required work; do not merge; do not treat as source of truth.

### KEEP

- `main`
- `backup/dukkanify-golden-20260914`
- `cursor/add-cloud-env-76f4` (open PR #7, unique `.cursor/environment.json`)
- `cursor/golden-production-lock-f438` (this documentation/archive PR)

Never deleted: `main`, backup branch/tag, UNKNOWN.

---

## PHASE 14 — CLOUD SESSION

This Cloud session had no unpushed unique product source before this lock. The only new Git work is this archive + report on `cursor/golden-production-lock-f438`. Future development must not depend on old Cloud tasks.

---

## PHASE 15 — ONE-SOURCE LOCK

```
GitHub:      dukkanify/sooqna.site
Canonical:   main
Backup:      tag dukkanify-sooqna-golden-20260914
             branch backup/dukkanify-golden-20260914
Deployment:  Vercel project sooqna
Production:  https://sooqna.site

Workflow:
  main → feature branch → Preview → QA → PR → main → Production
```

No required work remains only in a temporary Cloud session, local clone, or obsolete feature branch.

---

## SCORECARD

CANONICAL REPOSITORY: `dukkanify/sooqna.site`  
CANONICAL BRANCH: `main`

PASSWORD RESET FIX:  
Commit/PR: `adb3321` / PR #3  
In main: YES  
In Production: YES  
E2E result: **PASS**

GOLDEN MAIN SHA: `e5b2bbf4c885160bd9c341fcb8cfef00d449756a`  
PRODUCTION SHA: `e5b2bbf4c885160bd9c341fcb8cfef00d449756a`  
DEPLOYMENT ID: `6434363276`  
DOMAIN: https://sooqna.site

FEATURES:  
Marketplace CTA: YES / YES  
Phone/WhatsApp: YES / YES  
Purchase Eligibility: YES / YES  
Smart Filters: YES / YES  
Admin Dashboard: YES / YES  
Madmoon: YES / YES  
Notifications: YES / YES  
Mobile Logout: YES / YES  
26 Requirements: YES (code on main + Production)

AUTH:  
Register/Verify/Login: PASS  
Password Reset: PASS  
Old Password Rejected: PASS  
New Password Login: PASS  
Second New Password Login: PASS

QUALITY:  
Lint: PASS  
Tests: PASS (26/26)  
Build: PASS  
Isolation: PASS

BACKUP:  
Tag: `dukkanify-sooqna-golden-20260914`  
Branch: `backup/dukkanify-golden-20260914`  
SHA: `e5b2bbf4c885160bd9c341fcb8cfef00d449756a`  
Verified: YES

DOCS:  
Archived count: 74  
Deleted count: 0

BRANCHES:  
Before: 17 origin heads  
Deleted: 13  
Remaining origin heads: `main`, `backup/dukkanify-golden-20260914`, `cursor/add-cloud-env-76f4`, `cursor/cloud-agent-1789220497826-047vw` (+ this PR branch once pushed)

Deleted branches exactly:

1. `cursor/smart-category-search-filters-f438`  
2. `cursor/final-consolidation-report-f438`  
3. `feature/admin-dashboard-redesign`  
4. `fix/listing-intent-ctas`  
5. `fix/marketplace-purchase-eligibility`  
6. `integrity/final-delivery`  
7. `ismail-اسماعيل` (branch; tag retained)  
8. `perf/production-optimization`  
9. `qa/26-homepage-copy-fixes`  
10. `cursor/mobile-logout-visibility-9223`  
11. `cursor/source-of-truth-inventory-f438`  
12. `cursor/fix-password-reset-login-9223`  
13. `cursor/fix-login-clarity-f438`

Remaining origin branches exactly:

- `main`
- `backup/dukkanify-golden-20260914`
- `cursor/add-cloud-env-76f4`
- `cursor/cloud-agent-1789220497826-047vw`

DATA:  
Production DB changed destructively: NO  
Real users deleted: 0  
Real listings deleted: 0  
Transactions deleted: 0

---

## FINAL REQUIRED RESULT

| Flag | Result |
|---|---|
| ONE SOURCE OF TRUTH | **PASS** |
| PASSWORD RESET/NEW LOGIN | **PASS** |
| ALL APPROVED FEATURES ON MAIN | **PASS** |
| CLOUD PREVIEW | **PASS** |
| LIVE PRODUCTION | **PASS** |
| GOLDEN BACKUP | **PASS** |
| UNNECESSARY BRANCHES CLEANED | **PASS** |
| NO REQUIRED WORK LOST | **PASS** |
| PRODUCTION DATA SAFE | **PASS** |

Owner follow-up (does not unblock this golden code lock): set Production `CRON_SECRET` in Vercel so cron routes can return 401 instead of 503 `CRON_SECRET_REQUIRED`.

**SOOQNA GOLDEN VERSION COMPLETE**
