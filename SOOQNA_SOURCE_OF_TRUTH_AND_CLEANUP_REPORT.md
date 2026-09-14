# Sooqna — Source of Truth and Safe Cleanup Report

**Date (UTC):** 2026-09-14  
**Workspace:** Cursor Cloud checkout of `dukkanify/sooqna.site`  
**Rule followed:** nothing was deleted (branches, files, Vercel projects, deployments, or Production DB). AviatorPass was not touched. UAE-Sales was not modified.

---

## Canonical identity

```
GitHub dukkanify/sooqna.site
        ↓
main
        ↓
Vercel project sooqna (Git integration, production branch = main)
        ↓
https://sooqna.site
```

| Field | Value |
|---|---|
| **CANONICAL REPOSITORY** | `dukkanify/sooqna.site` |
| **CANONICAL BRANCH** | `main` |
| **ORIGIN MAIN SHA** | `d680f7898e4029ebfb16ef11a5bb902e20a678cb` |
| **ORIGIN MAIN SUBJECT** | `fix: make login copy readable and keep brand titles intact (#5)` |
| **PRODUCTION SHA** | `d680f7898e4029ebfb16ef11a5bb902e20a678cb` |
| **PRODUCTION REACHABLE FROM origin/main** | YES (Production SHA **is** origin/main tip) |
| **VERCEL PROJECT** | `sooqna` (`prj_57Tx2amGrhbopE69uXsYPPwcDFLL`) |
| **VERCEL TEAM** | Dukkanify Technology LLC's projects (`team_o5OCE3p3NPnlZAbIsp5ToYwN`) |
| **PRODUCTION DOMAIN** | https://sooqna.site |
| **GITHUB PRODUCTION DEPLOYMENT** | id `6432294001` @ 2026-09-14T07:18:47Z |
| **PRODUCTION URL (alias)** | https://sooqna-ovz6hlp0r-dukkanify-technology-llcs-projects.vercel.app (prior) / latest Git Production `d680f78` |
| **LIVE CHECK** | `GET https://sooqna.site/api/auth/status` → `ok: true`, `appUrl: https://sooqna.site` |
| **ISOLATION** | `npm run verify:isolation` **PASS** (no AviatorPass files/config) |
| **UAE-Sales** | Legacy only. Not a remote on this checkout. Must not receive Sooqna changes. |

GitHub `Deploy Production` workflow still warns that `VERCEL_DEPLOY_HOOK` is unset. Production nevertheless deploys from the Vercel Git integration on `main` (proven by GitHub Deployment records matching `origin/main`).

---

## Phase 2 — This checkout vs origin/main

Recorded at inventory start, then re-fetched after PR #5 merged mid-run.

| Check | Result |
|---|---|
| Remote `origin` | `https://github.com/dukkanify/sooqna.site` |
| Current agent branch (start) | `cursor/fix-login-clarity-f438` |
| Local `main` (stale pointer) | `af0eb0a` — **behind origin/main**; not a second source of truth |
| Working tree | Clean after restoring generated `next-env.d.ts` (Next.js `next dev` had rewritten the routes import to `.next/dev/types/routes.d.ts`) |
| Untracked files | None |
| Unpushed commits | None on this Cloud VM |
| Stash | Empty |
| Dangling commits (`git fsck`) | None reported |
| Reflog | Clone at `af0eb0a` → login-clarity work → no orphaned useful commits |

`next-env.d.ts` local edit is **GENERATED**. It was not committed. Do not treat Cloud `next dev` output as product source.

---

## FEATURE INVENTORY

Proven on `origin/main` (and therefore on Production, because Production SHA = origin/main tip).

| Feature | Branch that landed it | Commit / proof | MAIN | PRODUCTION | Action |
|---|---|---|---|---|---|
| Marketplace CTA (category-specific) | `fix/listing-intent-ctas` (merged ancestor) | `getListingActionConfig` in `shared/constants/listingActionConfig.ts`; test “category CTAs are centralized…” | **YES** | **YES** | Keep. Merged branch is a delete *candidate* only. |
| Phone / WhatsApp | same CTA lineage | `shared/listings/listing-contact.ts` (`getTelHref`, `getWhatsAppHref`); `ListingPrimaryAction` | **YES** | **YES** | Keep |
| Purchase eligibility | `fix/marketplace-purchase-eligibility` → PR **#1** | `shared/listings/purchase-eligibility.ts`; Buy Now gated on Stripe + category | **YES** | **YES** | Keep |
| Smart dynamic category filters | not found as a dedicated unmerged branch | Dynamic **create/edit** fields: `shared/constants/category-fields.ts`. Search page filters are generic (category/city/condition/price/sort) only — `getCategoryFields` is **not** used under `features/search` on any current remote branch | **PARTIAL** | **PARTIAL** | Not a disappearing-branch issue. Product gap: no per-spec search facets on any branch. Do not invent a merge. |
| Admin dashboard | `feature/admin-dashboard-redesign` → PR **#2** | `AdminOpsCockpit`, `/admin`, dashboard APIs | **YES** | **YES** | Keep |
| Madmoon product-condition verification | no live branch named `feature/madmoon-product-verification` on this repo | `shared/listings/escrow-eligibility.ts` (`requiresProductConditionVerification`); admin `heldMadmoon` | **YES** | **YES** | Feature is on main. Named branch is **absent** (likely merged/deleted on UAE-Sales or never pushed here). Nothing to preserve. |
| Notifications / deep links | on main (later notification PRs) | `/notifications`, `NotificationBell`, push (`migrations/005_push_subscriptions.sql`, `public/sw.js`) | **YES** | **YES** | Keep |
| 26-item requirement code | `qa/26-homepage-copy-fixes` + later main | `docs/SOOQNA_26_ISSUES_TRACEABILITY.md`; homepage copy/emirates work merged | **YES** (code) | **YES** (code) | Historical LIVE acceptance still recorded some BLOCKED E2E (env). `CRON_SECRET` still missing on live `/api/auth/status`. |
| Responsive / mobile | on main + open PR | Mobile home, sticky listing bar on main. **Logout on mobile dashboard chrome is NOT on main** | **PARTIAL** | **PARTIAL** | See PR **#4** below |
| Listing/contact UX | on main | Seller panel, contact-only vs Buy Now | **YES** | **YES** | Keep |
| Login contrast / EN heading | PR **#5** (merged this run) | `AuthBrandTitle` + auth card contrast | **YES** | **YES** | Landed on Production `d680f78` |

### Summary YES/NO (requested fields)

| Feature | MAIN | PRODUCTION |
|---|---|---|
| Marketplace CTA | YES | YES |
| Phone/WhatsApp | YES | YES |
| Purchase Eligibility | YES | YES |
| Smart Filters | PARTIAL | PARTIAL |
| Admin Dashboard | YES | YES |
| Madmoon Verification | YES | YES |
| Notifications | YES | YES |
| 26 Requirements | YES (code) | YES (code) |

---

## BRANCH INVENTORY

Remote branches on `origin` after `git fetch --prune`: **12** (including `main`).

Local branches on this VM: `main` (stale pointer), `cursor/fix-login-clarity-f438`, `cursor/source-of-truth-inventory-f438` (this report).

### Must preserve (unique useful work not in main)

| Branch | Latest SHA | Merged into main? | Newer than main? | Unique work | Safe to delete? | Action |
|---|---|---|---|---|---|---|
| `origin/cursor/mobile-logout-visibility-9223` | `71d0cb0` | **NO** | 1 unique commit; 1 behind tip | Adds visible `تسجيل الخروج` on mobile dashboard header + bottom card (`DashboardShell.tsx`) | **NO** | **MUST_MERGE_OR_PRESERVE**. Open PR **#4** (draft). Do not delete. |

### Content already on main (squash / equivalent patch) — delete *candidates* only after human approval

| Branch | Latest SHA | Ancestry merged? | Content vs origin/main | Safe to delete? | Action |
|---|---|---|---|---|---|
| `origin/cursor/fix-login-clarity-f438` | `76376d7` | NO (squash) | **two-dot empty**; `git cherry` equivalent (`-`) | Candidate | PR **#5** merged. Branch leftover. |
| `origin/cursor/fix-password-reset-login-9223` | `26c3519` | NO (squash) | Unique files already in `#3` squash `adb3321`. Two-dot vs new main only shows later login-clarity files the old branch lacks | Candidate | PR **#3** merged. |
| `origin/cursor/cloud-agent-1789220497826-047vw` | `7f4d1ad` | NO | `git cherry` equivalent (`-`). Huge two-dot diff is **behind** 23 commits, not extra product | Candidate | Temporary Cloud snapshot. Preserve until approved. |
| `origin/feature/admin-dashboard-redesign` | `fdfff07` | **YES** | Ancestor of main | Candidate | PR **#2** merged |
| `origin/fix/listing-intent-ctas` | `06d704c` | **YES** | Ancestor of main | Candidate | CTA work is on main |
| `origin/fix/marketplace-purchase-eligibility` | `97105b7` | **YES** | Ancestor of main | Candidate | PR **#1** merged |
| `origin/integrity/final-delivery` | `424b68d` | **YES** | Ancestor of main | Candidate | |
| `origin/ismail-اسماعيل` | `9651b3e` | **YES** | Ancestor of main | Candidate | Republish snapshot already on main |
| `origin/perf/production-optimization` | `9a1edbc` | **YES** | Ancestor of main | Candidate | |
| `origin/qa/26-homepage-copy-fixes` | `ec0ec92` | **YES** | Ancestor of main | Candidate | |

**Not present on this repository:** `feature/madmoon-product-verification`. Madmoon verification **code is on main**. No branch to preserve.

### Totals

| | Count |
|---|---|
| Total remotes (excl. HEAD) | 12 |
| Fully merged by ancestry | **7** (`admin-dashboard-redesign`, `listing-intent-ctas`, `marketplace-purchase-eligibility`, `integrity/final-delivery`, `ismail-اسماعيل`, `perf/production-optimization`, `qa/26-homepage-copy-fixes`) |
| Unmerged leftover after squash (content on main) | 3 (login-clarity, password-reset, cloud-agent) |
| Must preserve | **1** (`mobile-logout-visibility-9223`) |
| Safe delete candidates (not deleted) | 10 leftover remotes above, **excluding** mobile-logout |

Do **not** delete `main`. Do not force-push.

---

## UNPUSHED / ORPHANED / CLOUD-ONLY WORK

| Item | Found? | Action |
|---|---|---|
| Uncommitted product code | NO (only generated `next-env.d.ts` from `next dev`, restored) | Discard locally; do not commit |
| Unpushed commits on this VM | NO | |
| Orphaned useful commits | NO | |
| Useful untracked files | NO | |
| Stale local `main` pointer | YES — `af0eb0a` vs `d680f78` | Fast-forward local `main` when convenient; not unique work |
| Isolated Cloud workspace as source of truth | This VM is a **copy**. Canonical is GitHub `origin/main` | Going-forward workflow below |

---

## FILE CLEANUP CLASSIFICATION

No generated folders (`.next`, `node_modules`, `coverage`, `dist`) are tracked. `.gitignore` already lists them.

`.env` / `.env*.local` are gitignored. Tracked env templates only: `.env.example`, `.env.production.example` (**REQUIRED_SOURCE**).

### Counts (this tree)

| Class | Notes |
|---|---|
| REQUIRED_RUNTIME | `app/`, `features/`, `services/`, `shared/`, `public/`, `fonts/`, `proxy.ts`, `vercel.json` |
| REQUIRED_SOURCE | `package.json`, lockfile, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `migrations/`, `types/`, `scripts/`, i18n, env examples |
| REQUIRED_DOCUMENTATION | README, AGENTS, guides listed as CURRENT below |
| GENERATED | `.next/`, `node_modules/` (untracked). `next-env.d.ts` is tracked but rewritten by Next — keep tracked, do not hand-edit |
| TEMPORARY | None committed |
| OBSOLETE | None **proven** unused in runtime. Historical Markdown is documentation, not obsolete code |
| UNCERTAIN | Historical reports (keep or archive, do not delete) |

### CURRENT documentation (keep at repo root)

- `README.md`, `AGENTS.md`, `KNOWN_LIMITATIONS.md`
- `PRODUCTION_DEPLOYMENT_GUIDE.md`, `STRIPE_GO_LIVE.md`, `STRIPE_WEBHOOK_SETUP.md`
- `BRAND_IDENTITY_GUIDE.md`, `BRAND_MIGRATION_REPORT.md`
- `DESIGN_SYSTEM.md`, `DESIGN_DECISIONS.md`, `UI_STYLE_GUIDE.md`, `ARCHITECTURE.md`, `FRONTEND_STRUCTURE.md`
- `ESCROW_PAYMENT_MODEL.md`, `PAYMENT_FLOW_DOCUMENTATION.md`, `API_INTEGRATION_GUIDE.md`
- `TESTING_GUIDE.md`, `CLOSED_BETA_PLAN.md`
- `SOOQNA_FINAL_PRODUCTION_CUTOVER_REPORT.md` (proves Git retarget to `sooqna.site`)
- `docs/SOOQNA_26_ISSUES_TRACEABILITY.md`, `docs/design-system.md`
- **This file**

### HISTORICAL (propose **move** to `docs/archive/`, not delete)

74 root `*_REPORT.md` / acceptance / score / changelog files. Full list is in the appendix. Runtime does not import them.

### LIST EXACT FILES PROPOSED FOR DELETION

**None.**

No committed file was proven class D/E/F unused. Archive-by-move is the only documentation cleanup proposed, and it requires human approval.

Optional non-deletion hygiene (not done): add `.vercel/` to `.gitignore` (already in `.vercelignore`).

---

## Phase 11 — Consolidation (not bulk-merged)

| Work | Status |
|---|---|
| PR **#5** login clarity | Merged to `main` and Production during this inventory |
| PR **#4** mobile logout | **Still draft / unmerged.** Required for mobile dashboard logout visibility. Do not delete the branch. Merge via its own PR after QA — do not bulk-merge with unrelated leftovers |
| Smart search facets | Not present on any branch; cannot merge from Git |

---

## Phase 13 — Quality gates (`origin/main` = `d680f78`)

| Gate | Result |
|---|---|
| `npm test` | **PASS** (20/20) |
| `npm run verify:isolation` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** (Next.js 16.2.9, 158 static pages generated) |

**Pre-existing (not introduced by this inventory):**

- Turbopack NFT warning tracing `next.config.ts` → `services/payments/data-store.ts` (`path` / cwd).
- Next.js warning: custom `Cache-Control` on `/_next/static/:path*`.
- Live config still reports `missing: ["CRON_SECRET"]` (fail-closed cron). Not a Git-branch problem.

---

## Phase 14 — Preview / Production

| Surface | Evidence |
|---|---|
| Production https://sooqna.site | HTTP 200; auth status ok; SHA `d680f78` |
| Login contrast (just merged) | Covered by Production deploy of #5 |
| Mobile logout | Preview: https://sooqna-okskg6cbm-dukkanify-technology-llcs-projects.vercel.app (PR #4) — **not Production** |
| Admin / Madmoon / CTA / WhatsApp | On Production via main |

No new Production deploy was triggered by this report.

---

## Phase 17 — Standard workflow going forward

1. Open **one** Cloud task against `dukkanify/sooqna.site`.
2. `git fetch origin main` and branch from **latest** `origin/main`.
3. Create `feature/<name>` or `fix/<name>` (Cloud agents: `cursor/<name>-f438` when required by the agent policy).
4. Change code. Do not treat the Cloud VM as canonical.
5. Commit.
6. `git push -u origin <branch>`.
7. Vercel Preview (Git integration).
8. QA the Preview URL.
9. PR → `main`.
10. Merge.
11. Production deploy from `main` (Vercel Git). Confirm GitHub Deployment `environment=Production` SHA = `origin/main`.
12. Verify https://sooqna.site (`/api/auth/status`, representative flows).

Never leave approved work only in a Cloud session. Never push Sooqna product changes to `dukkanify/UAE-Sales`. Never touch AviatorPass.

---

## MISSING FEATURES FROM MAIN

| Item | Notes |
|---|---|
| Mobile dashboard logout affordance | Unique to `cursor/mobile-logout-visibility-9223` / PR #4 |
| Category-spec **search** facets | Not on main **and not on any current branch** |

## MISSING FEATURES FROM PRODUCTION

Same as main (Production tracks `origin/main`). Plus live `CRON_SECRET` still unset.

## UNPUSHED WORK FOUND

None (product). Generated `next-env.d.ts` only.

## ORPHANED COMMITS FOUND

None.

---

## FINAL STATUS

**C) UNPUSHED/UNMERGED WORK FOUND — DO NOT DELETE YET**

Canonical pipeline GitHub `sooqna.site` → `main` → Vercel `sooqna` → https://sooqna.site **is already locked and verified** (Production SHA = origin/main). Cleanup must wait because:

1. PR **#4** mobile logout is unmerged unique work.
2. Ten leftover remotes are only *candidates*; none were deleted.
3. Historical Markdown may be archived later; **deletion list is empty** pending approval.

---

## Appendix — historical Markdown proposed for `docs/archive/` (move, do not delete)

ARCHITECTURE_CLEANUP_REPORT.md  
AUTH_MIGRATION_REPORT.md  
AUTH_PERSISTENCE_FIX_REPORT.md  
AUTH_UI_CLEANUP_REPORT.md  
AUTOMATIC_ACCOUNT_CREATION_REPORT.md  
BETA_FEEDBACK_FORM.md  
CATEGORY_ACTIONS_COMPLETION_REPORT.md  
CATEGORY_ACTION_ENGINE_REPORT.md  
CHAT_VERIFICATION_REPORT.md  
CHECKOUT_CONFIRMATION_REPORT.md  
CHECKOUT_CONTINUE_BUTTON_FIX_REPORT.md  
CHECKOUT_SHIPPING_REPORT.md  
COMPLETE_I18N_AND_DIRECTION_AUDIT_REPORT.md  
COMPONENT_USAGE_REPORT.md  
CRITICAL_BUG_FIX_REPORT.md  
CURRENCY_AUDIT_REPORT.md  
CURRENCY_SYMBOL_REPORT.md  
DESIGN_ENFORCEMENT_REPORT.md  
DESIGN_IMPROVEMENTS.md  
DESIGN_SCORE.md  
DOMAIN_MIGRATION_REPORT.md  
DYNAMIC_EDIT_LISTING_REPORT.md  
DYNAMIC_LISTING_SYSTEM_REPORT.md  
EMAIL_NOTIFICATIONS_PRODUCTION_REPORT.md  
EMAIL_OTP_MIGRATION_REPORT.md  
EMAIL_OTP_SECURITY_REPORT.md  
EMAIL_TEMPLATE_REPORT.md  
ENGLISH_TRANSLATION_AUDIT_REPORT.md  
FAVORITES_API_MIGRATION_REPORT.md  
FAVORITES_SYSTEM_FIX_REPORT.md  
FAVORITE_SHARE_FIX_REPORT.md  
FINAL_DESIGN_SCORE.md  
FINAL_E2E_QA_REPORT.md  
FINAL_LISTING_CHECKOUT_QA_REPORT.md  
FULL_PROJECT_QA_I18N_REPORT.md  
GUEST_CHECKOUT_IMPLEMENTATION_REPORT.md  
GUEST_ORDER_ACCESS_SECURITY_REPORT.md  
IMAGE_AUDIT_REPORT.md  
LISTING_DATA_INTEGRITY_REPORT.md  
LISTING_DETAILS_REBUILD_REPORT.md  
LIVE_DATA_AUTH_URGENT_ACCEPTANCE_REPORT.md  
MOBILE_STICKY_ACTION_BAR_REPORT.md  
OTP_FEATURE_POSTPONEMENT_REPORT.md  
P0_AUTH_EMAIL_NOTIFICATION_STABILITY_REPORT.md  
PASSWORDLESS_EMAIL_AUTH_REPORT.md  
PASSWORDLESS_OTP_PRODUCTION_QA_REPORT.md  
PERFORMANCE_AUDIT_REPORT.md  
PR22_REGRESSION_QA_REPORT.md  
PRODUCTION_AUTH_EMAIL_FINAL_QA_REPORT.md  
PRODUCTION_LIVE_DEPLOYMENT_REPORT.md  
PRODUCTION_POLISH_REPORT.md  
PRODUCTION_READY_REPORT.md  
PROJECT_CLEANUP_REPORT.md  
PROJECT_STATUS_AUGUST_2026.md  
PROJECT_STATUS_REPORT.md  
REACT_ERROR_185_ROOT_CAUSE_REPORT.md  
RESPONSIVE_REPORT.md  
SHARE_ICON_FIX_REPORT.md  
SOOQNA_26_ISSUES_FINAL_ACCEPTANCE_REPORT.md  
SOOQNA_ADMIN_DASHBOARD_REDESIGN_ACCEPTANCE.md  
SOOQNA_FINAL_26_PRODUCTION_ACCEPTANCE.md  
SOOQNA_FINAL_PRODUCTION_ACCEPTANCE_REPORT.md  
SOOQNA_FULL_TECHNICAL_REMEDIATION_REPORT.md  
SOOQNA_P0_PRE_CUTOVER_ACCEPTANCE_REPORT.md  
SOOQNA_PERFORMANCE_BASELINE.md  
STRIPE_CONNECT_ONBOARDING_REPORT.md  
STRIPE_INTEGRATION_REPORT.md  
UI_CONSISTENCY_REPORT.md  
UI_QA_REPORT.md  
UI_VISIBILITY_AUDIT.md  
UPLOAD_REPORT.md  
VISUAL_CHANGELOG.md  
WEBSITE_DESIGN_CONSISTENCY_REPORT.md  
