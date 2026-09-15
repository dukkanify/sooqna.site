# Dukkanify — Two-project final isolation report

**Owner:** Dukkanify Technology LLC  
**Date (UTC):** 2026-09-15  
**Rule followed:** inventory first; no Git repository, Vercel project, Production database, domain, secret, or UNKNOWN resource was deleted.  
**This checkout:** `dukkanify/sooqna.site` only. AviatorPass was verified via GitHub + live HTTPS. UAE-Sales was not modified.

**ACTIVE PROJECTS: 2**

1. SOOQNA  
2. AVIATORPASS

---

## Exact lists (section 14)

### KEEP_PROJECTS
- Sooqna (`dukkanify/sooqna.site` → `main` → Vercel `sooqna` → https://sooqna.site)
- AviatorPass (`dukkanify/AviatorPass` → `main` → Vercel `aviatorpass` → https://aviatorpass.com/ → https://www.aviatorpass.com/)

### ARCHIVE_PROJECTS
- `dukkanify/UAE-Sales` — **LEGACY SOOQNA SOURCE**. Preferred action: **ARCHIVE / READ-ONLY**. Do **not** hard-delete unless the owner later approves.

### OTHER_CLIENT_KEEP (not Sooqna, not AviatorPass — do not delete)
These are live Dukkanify client sites. They are **not** obsolete Cursor workspaces. They are **not** part of the two working products. Leave them alone.

- `dukkanify/wateen-production` — https://wateen-production.vercel.app/ HTTP 200
- `dukkanify/esnaad-legal-2` — https://esnaad-legall.vercel.app/ HTTP 200
- `dukkanify/pegasus-drink` — https://pegasus-drink.vercel.app/ HTTP 200
- `dukkanify/esnaad-legal` — empty-ish companion repo; **UNKNOWN**, do not delete

### SAFE_TO_CLOSE_CURSOR_SESSIONS
Environment-scoped Cursor Cloud list for this Sooqna environment: **42 agents**. No MCP tool exists to archive/kill another session. **Closed this run: 0.**

Classified **SAFE_TO_CLOSE** (chat/smoke only; no unique unmerged Git work attached, or attached branch already merged to `main`):

| Session | Branch | Why safe |
|---|---|---|
| Complete Buy Again checkout | none | Internal smoke; Buy Again is on `main` (#13) |
| Retest Buy Again checkout | none | Internal smoke |
| Browser-test Buy Again flow | none | Internal smoke |
| LIVE smoke Sooqna production | `cursor/fix-login-clarity-f438` | PR #5 merged |
| Retry demo user LoginForm | none | Internal smoke |
| Quick LIVE smoke after redeploy | none | Internal smoke |
| LIVE homepage login admin smoke | none | Internal smoke |
| Try GitHub SSO on Vercel | none | Internal smoke |
| Vercel Production cron redeploy | none | Internal smoke |
| LIVE reset LoginForm completion | none | Internal smoke |
| LIVE reset and responsive smoke | none | Internal smoke |
| Finish LIVE auth admin smoke | none | Internal smoke |
| LIVE marketplace admin auth smoke | none | Internal smoke |
| Review login hotfix video | none | Artifact review |
| Review reset LoginForm video | none | Artifact review |
| LIVE reset then LoginForm (several) | none / merged hotfix | Internal smoke |
| LIVE forgot-password UI | none | Internal smoke |
| LIVE LoginForm Production E2E | `cursor/fix-login-clarity-f438` | PR #5 merged |
| Reset password then LoginForm | `cursor/golden-production-lock-f438` | PR #10 merged |
| Fresh QA LoginForm and reset | none | Internal smoke |
| Review preview login hotfix video | none | Artifact review |
| Preview LoginForm browser E2E | `cursor/golden-production-lock-f438` | PR #10 merged |
| Retry LIVE demo login | `cursor/golden-production-lock-f438` | PR #10 merged |
| LIVE Sooqna UI certification | none | Internal smoke |
| Production smoke CTA and filters | none | Internal smoke |
| Verify mobile drawer and sort | none | Internal smoke |
| Verify smart search filters | `cursor/smart-category-search-filters-f438` | PR #8 merged |
| Finish EN desktop logout | none | Internal smoke |
| Verify mobile logout | none | Internal smoke |
| Review / record login walkthrough | none | Artifact review |
| Verify login page contrast | none | Internal smoke |
| Screenshot login and reset pages | none | Internal smoke |
| Explore auth durability options | none | Read-only explore |
| Explore notifications system | none | Read-only explore |
| Safe GitHub push process (`cursor/fix-password-reset-login-9223`) | merged PR #3 | Useful work is on `main` |
| Smoke homepage and search (ERROR) | `cursor/fix-login-clarity-f438` | PR #5 merged |

**KEEP open (not SAFE_TO_CLOSE):**

| Session | Reason |
|---|---|
| Cloud live project update (`bc-acaf72a1-3792-43db-b3b9-ffcc85f1f438`) | This run. RUNNING. |
| new update | Desktop session; no unique branch recorded — treat as **UNKNOWN** until the owner confirms it is empty |
| Safe GitHub push process (`cursor/cloud-agent-1789220497826-047vw`) | Remote branch still exists and is **diverged** with unique UI files |

AviatorPass Cursor Cloud sessions are **not visible** in this environment (repos = `github.com/dukkanify/sooqna.site` only). They were not closed.

### KEEP_BRANCHES

**Sooqna (`dukkanify/sooqna.site`):**
- `main` `6e51fa75068833af13441b5710351116ab9c1fae`
- `backup/dukkanify-golden-20260914` `e5b2bbf4c885` (behind `main` by 4; ancestor)
- `backup/dukkanify-golden-20260914-final` `3bc2bf3b1161` (behind `main` by 2; ancestor)
- `cursor/qa-isolated-cleanup-f438` — open draft PR **#14** (ahead 1)
- `cursor/add-cloud-env-76f4` — open draft PR **#7** (unique `.cursor/environment.json`; CONFLICTING vs old base)

**AviatorPass (`dukkanify/AviatorPass`):**
- `main` `4694e02d2f06b9c2447801eaa5c9256c55ec7d3c`

**Tags to keep (Sooqna):**
- `dukkanify-sooqna-golden-20260914`
- `dukkanify-sooqna-golden-20260914-final`

### SAFE_DELETE_BRANCHES
Remote delete was **not** executed (owner approval required). Candidates only:

**Sooqna:** none remaining. Merged feature branches from PRs #1–#13 were already removed from the remote.

**AviatorPass (ahead of `main` = 0; contained in `main` history):**
- `develop`
- `aviatorpass`
- `cursor/atpl-subjects-restore-c0e6` (merged #34)
- `cursor/client-review-branding-c0e6` (merged #13)
- `cursor/course-management-redesign-c0e6` (merged #30)
- `cursor/final-production-audit-0987`
- `cursor/production-stabilization-fixes-c0e6` (merged #1)
- `cursor/production-website-url-c0e6` (merged #12)
- `cursor/workspace-isolation-0987`

Squash-merged `cursor/*-c0e6` heads that still show `ahead > 0` are **not** listed here. GitHub `ahead` after squash is expected and can hide extra unique commits. Those stay **UNKNOWN**.

### UNKNOWN_BRANCHES

**Sooqna:**
- `cursor/cloud-agent-1789220497826-047vw` — diverged: ahead 1 / behind 32. Unique files include home/search/listing loading and marketplace UI. **Do not delete.**
- Tag `ismail-اسماعيل` — historical; **UNKNOWN**, do not delete

**AviatorPass (ahead of `main` > 0 — do not delete):**
- `cursor/atpl-course-landing-c0e6`
- `cursor/atpl-subjects-cms-c0e6`
- `cursor/checkout-quote-load-c0e6`
- `cursor/clear-course-labels-c0e6`
- `cursor/country-currency-routing-c0e6`
- `cursor/course-menu-labels-c0e6`
- `cursor/demo-accounts-domain-c0e6`
- `cursor/dynamic-stripe-payments-c0e6`
- `cursor/email-notifications-c0e6`
- `cursor/enable-stripe-c0e6`
- `cursor/final-production-success-0987` (no merged PR)
- `cursor/final-zero-blocker-0987` (no merged PR)
- `cursor/gateway-country-routing-c0e6`
- `cursor/infrastructure-cleanup-c0e6`
- `cursor/mobile-responsive-ux-c0e6`
- `cursor/my-courses-empty-state-c0e6`
- `cursor/platform-ux-improvements-c0e6`
- `cursor/production-blockers-c0e6`
- `cursor/project-branding-c0e6`
- `cursor/purchase-first-enrollment-c0e6`
- `cursor/registration-legal-fix-c0e6`
- `cursor/registration-password-validation-c0e6`
- `cursor/registration-verification-c0e6`
- `cursor/required-secrets-0987` (no merged PR)
- `cursor/stripe-checkout-integration-c0e6`
- `cursor/stripe-purchase-first-c0e6`
- `cursor/student-dashboard-enterprise-c0e6`
- `cursor/student-dashboard-mockup-c0e6`
- `cursor/student-dashboard-redesign-c0e6`
- `cursor/taly-integration-c0e6`
- `cursor/tamara-integration-c0e6`
- `cursor/welcome-redirect-c0e6`
- `cursor/zoom-join-base-url-c0e6`
- `cursor/zoom-oauth-integration-c0e6`
- `cursor/zoom-webhook-reachable-c0e6`

**UAE-Sales:** entire leftover branch set (Sooqna `-37ba`, AviatorPass `aep-*` / `aviatorpass-*` / `-0987`, plus open historical PRs). Treat as **LEGACY archive inventory**, not a third product. Do not bulk-delete.

### KEEP_VERCEL_PROJECTS
- `sooqna` (live alias `sooqna-8qcc00gmv-dukkanify-technology-llcs-projects.vercel.app`; custom domain `sooqna.site`)
- `aviatorpass` (live alias `aviatorpass-bbkjfc7t8-dukkanify-technology-llcs-projects.vercel.app`; custom domains `aviatorpass.com` + `www.aviatorpass.com`)

### LEGACY_VERCEL_PROJECTS
- `uae-sales` — https://uae-sales.vercel.app/ → HTTP **404** `DEPLOYMENT_NOT_FOUND`. Custom domain removal / project archive needs owner approval.

### UNKNOWN_VERCEL_PROJECTS
Vercel MCP is **unauthenticated** (`needsAuth`). Full project list cannot be confirmed. Inferred from GitHub `homepageUrl` + live HTTP, **do not delete**:
- `wateen-production`
- `esnaad-legall` (repo `esnaad-legal-2`)
- `pegasus-drink`
- any other Vercel project not named `sooqna` or `aviatorpass`

---

## 1. Inventory (read-only)

### GitHub org `dukkanify`

| Repository | Classification | Notes |
|---|---|---|
| `sooqna.site` | **SOOQNA_REQUIRED** | Canonical Sooqna source. Default branch `main`. |
| `AviatorPass` | **AVIATORPASS_REQUIRED** | Canonical AviatorPass source. Default branch `main`. |
| `UAE-Sales` | **LEGACY_SAFE** (legacy Sooqna source) | Not archived. Mixed Sooqna + AviatorPass historical branches. |
| `wateen-production` | **UNKNOWN** / other client | Live 200. |
| `esnaad-legal-2` | **UNKNOWN** / other client | Live 200. |
| `pegasus-drink` | **UNKNOWN** / other client | Live 200. |
| `esnaad-legal` | **UNKNOWN** | Companion repo. |

This Cloud VM remote: **only** `origin` → `https://github.com/dukkanify/sooqna.site`. No AviatorPass or UAE-Sales remotes on this checkout.

### Cursor Cloud
- This run: `bc-acaf72a1-3792-43db-b3b9-ffcc85f1f438` “Cloud live project update”
- Environment repos: `github.com/dukkanify/sooqna.site` only
- Accessible agents in this environment: **42** (including archived filter on; none archived)
- No `archive` / `close` / `kill` tool in `cursor-cloud` MCP

### Vercel / domains / cron / webhooks
Cannot list Vercel env var **values** (MCP `needsAuth`; no `VERCEL_TOKEN` in this VM). Proven from GitHub Deployments + live HTTP:

| Item | Sooqna | AviatorPass |
|---|---|---|
| GitHub Production deploy | id `6442083501` SHA `6e51fa750688` success | id `6382615497` SHA `4694e02d2f06` success |
| Production alias | `sooqna-8qcc00gmv-…vercel.app` | `aviatorpass-bbkjfc7t8-…vercel.app` |
| Custom domain | https://sooqna.site HTTP 200, `dpl_3o5rNSQRpsZmFcRtMRt2dp9iXiwe` | https://aviatorpass.com/ 308 → https://www.aviatorpass.com/ 200 |
| Cron (repo `vercel.json`) | `0 6 * * *` → `/api/cron/dispute-reminders` | `0 6 * * *` → `/api/cron/email-queue` |
| Stripe webhook | `POST /api/webhooks/stripe` → 400 `MISSING_SIGNATURE` | `POST /api/payments/webhook` → 400 `Invalid Stripe webhook signature` |
| Email | Resend configured; from `no-reply@sooqna.site` | Resend in repo templates; domain `aviatorpass.com` |

### Databases / storage (names only, no secrets)
| | Sooqna live `/api/auth/status` | AviatorPass live `/api/health` |
|---|---|---|
| Store | Postgres `auth_users` (`DATABASE_URL`) | Postgres `aep_json_store` |
| Durable | `persistence.durable: true` | Data store **pass**, 99ms |
| Media | Sooqna listing/media on this product | Storage **pass**: provider `local`, uploads under `public/uploads` |

---

## 2. Prove Sooqna

| Field | Value |
|---|---|
| Repository | `dukkanify/sooqna.site` |
| Branch | `main` |
| Production SHA | `6e51fa75068833af13441b5710351116ab9c1fae` |
| `origin/main` | **same SHA** |
| Vercel project | `sooqna` |
| Domain | https://sooqna.site |
| HTML deploy id | `dpl_3o5rNSQRpsZmFcRtMRt2dp9iXiwe` |
| Isolation script | `npm run verify:isolation` → **PASS** (no AviatorPass files/config) |

UAE-Sales is **not** the current Production source:
- Current Production SHA `6e51fa7` is **absent** from `dukkanify/UAE-Sales`
- Last UAE-Sales GitHub Production deploy (2026-09-07) SHA `0986a2f47139` **is** an ancestor inside `sooqna.site`, then Sooqna moved forward on this repo
- https://uae-sales.vercel.app/ is **404 DEPLOYMENT_NOT_FOUND**
- Live homepage title is `Sooqna \| سوقنا` (no AviatorPass / UAE-Sales strings)

### Attached systems (boolean / names only)

From `GET https://sooqna.site/api/auth/status`:

| System | Live |
|---|---|
| Postgres | **yes** (`databaseConfigured: true`, source `DATABASE_URL`, not degraded) |
| Email / Resend | **yes** (`resendConfigured: true`, `EMAIL_FROM_ADDRESS=no-reply@sooqna.site`) |
| Stripe | **yes** (secret + publishable + webhook configured; currency `aed`; mock checkout **false**) |
| Auth / session | **yes** (`sessionSecretConfigured: true`; demo login `user@sooqna.demo` → 200 `ok: true`) |
| Notifications | **yes** (unauth 401; authed 200) |
| Cron | **route present**, secret **MISSING** (`cronSecretConfigured: false`, `missing: ["CRON_SECRET"]`) |
| Storage/media | listings/search HTML 200; no separate object-store health endpoint |

Unauthorized cron: `GET /api/cron/dispute-reminders` → **503** `{ "error": "CRON_SECRET_REQUIRED" }` (fail-closed). Owner still needs to set Production `CRON_SECRET` (do not paste the value). This does **not** block classifying Sooqna as the canonical live product.

`www.sooqna.site` does not resolve. Apex `sooqna.site` is the required domain.

---

## 3. Prove AviatorPass

| Field | Value |
|---|---|
| Repository | `dukkanify/AviatorPass` |
| Branch | `main` |
| Vercel project | `aviatorpass` |
| Production SHA | `4694e02d2f06b9c2447801eaa5c9256c55ec7d3c` |
| Live health SHA | **same** (`gitRef: main`, `vercelEnv: production`) |
| Domain | https://aviatorpass.com/ → https://www.aviatorpass.com/ |
| Database/storage | Postgres `aep_json_store`; local `public/uploads` |
| Stripe | Webhook `POST /api/payments/webhook` (signature checked). Also Tamara + Taly in env templates |
| Email | Resend (`RESEND_API_KEY`, `EMAIL_FROM`) in production example; cron queue `/api/cron/email-queue` |
| Cron | Present; unauth GET/POST → **401 Unauthorized** (secret **is** configured, unlike Sooqna) |
| Auth | `/login` 200 “Sign in \| Aviator Pass”; empty POST login → **403 CSRF**; `/admin` redirects to login |

Live `/api/health` `status: "degraded"` because storage provider is `local`, while `app` and `database` checks **pass**. Product is live; this is an ops note, not a Sooqna coupling.

### No Sooqna resource dependency (proven)

| Check | Result |
|---|---|
| Homepage HTML | Contains Aviator Pass; **no** `sooqna` / `سوقنا` |
| Login HTML | Same |
| Health `service` | `"aviatorpass"` |
| DB name | `aep_json_store` ≠ Sooqna `auth_users` |
| Cron path | `/api/cron/email-queue` ≠ `/api/cron/dispute-reminders` |
| Stripe webhook path | `/api/payments/webhook` ≠ `/api/webhooks/stripe` |
| From-address templates | `aviatorpass.com` ≠ `no-reply@sooqna.site` |
| Deploy hook name in AviatorPass repo | `VERCEL_AVIATORPASS_DEPLOY_HOOK` (AviatorPass-only) |
| Extra vendors | Zoom, Tamara, Taly, optional Supabase — **not** in Sooqna runtime snapshot |
| `sooqna.site` isolation script | PASS (this repo has no AviatorPass config) |

**Shared vendor accounts (intentional at company level, not proven secret-sharing):**
Dukkanify likely uses one Vercel team, and may use one Stripe / Resend / Postgres **provider** account with **separate projects**. Values were not compared (Vercel MCP unauthenticated). Do not copy secrets between projects.

---

## 4. UAE-Sales legacy handling

**Classification:** LEGACY SOOQNA SOURCE (not a third active product).  
**Action:** ARCHIVE / READ-ONLY. **Not hard-deleted.**

Proof before any future archive:

| Requirement | Proof |
|---|---|
| sooqna.site no longer deploys from UAE-Sales | Current Production SHA `6e51fa7` exists only on `sooqna.site`; GitHub Production for `sooqna.site` is that SHA |
| Vercel `sooqna` no longer depends on UAE-Sales as Git source | Live HTML `dpl_3o5rNSQRpsZmFcRtMRt2dp9iXiwe` matches `sooqna.site` Production; UAE-Sales homepage `uae-sales.vercel.app` is 404 |
| No current Production hook depends on it | Latest Sooqna Production GitHub deployment is from `dukkanify/sooqna.site` `main`. AviatorPass Production is from `dukkanify/AviatorPass` `main` |
| No required unique commit missing from sooqna.site | UAE-Sales `main` `2d9dc47` (await reset/listing emails) is **not** the same SHA on sooqna.site, but sooqna.site `app/api/auth/password/reset/request-link/route.ts` **already awaits** `emailPasswordResetLink`. Keep UAE-Sales as archive in case leftover docs/PRs are needed |
| No AviatorPass resource depends on it | AviatorPass canonical repo is `dukkanify/AviatorPass`; live health SHA is that `main`. Historical `aep-*` branches on UAE-Sales are leftover, not Production |

Do **not** move Sooqna development back to UAE-Sales.

---

## 5. Cursor workflow going forward

**SOOQNA:** open only `dukkanify/sooqna.site`.  
**AVIATORPASS:** open only `dukkanify/AviatorPass`.  
Do not develop Sooqna from UAE-Sales. Do not treat old Cursor sessions as source of truth.

Every change: latest `main` → feature/fix branch → Preview → QA → PR → `main` → Production.

---

## 6. Environment isolation

| Variable class | Sooqna intended | AviatorPass intended | Shared? |
|---|---|---|---|
| App URL | `https://sooqna.site` (live snapshot) | `https://www.aviatorpass.com` | **No** |
| DATABASE_URL | Postgres `auth_users` | Postgres `aep_json_store` (+ optional Supabase) | **Not observed.** URL equality UNKNOWN without Vercel dashboard |
| Stripe webhook | `/api/webhooks/stripe` | `/api/payments/webhook` | **Not observed** as the same endpoint |
| Email from | `no-reply@sooqna.site` | `aviatorpass.com` templates | **No** (same Resend *company* account possible) |
| Cron secret / path | dispute-reminders; secret **unset** | email-queue; unauth **401** | **No** |
| Deploy hook | Sooqna Git integration on `main` | `VERCEL_AVIATORPASS_DEPLOY_HOOK` | **No** |

Secrets were **not** printed and **not** copied.

---

## 7. Production data safety

**No data cleanup ran in this isolation task.**

Sooqna protected data from the previous approved QA cleanup remains the policy: real users, `live-mkt-*`, `local-1789075968004`, orders, Stripe events, showcase, blocked/unknown E2E, Madmoon, disputes, related notifications, audit history. **Do not run another cleanup unless separately approved.**

AviatorPass: do not delete users, bookings/orders, payments, tickets/passes, transactions, uploads, audit records.

---

## 8. Zero-risk cleanup executed

| Action | Result |
|---|---|
| Close obsolete Cursor sessions | **Not possible** via MCP. Classified only. Closed = 0 |
| Prune stale local remote refs | `git fetch origin --prune` / `git remote prune origin` on this Sooqna checkout |
| Remove generated local build cache | Deleted this VM’s `.next/` (1.1G). Not product source |
| Delete Git repos | **Not done** |
| Delete Vercel projects / domains | **Not done** |
| Delete Production DBs | **Not done** |
| Delete remote UNKNOWN branches | **Not done** |
| Archive UAE-Sales | **Not done** (needs owner GitHub archive click) |

---

## 9. Live health check

### SOOQNA

| Check | Result |
|---|---|
| Homepage | **PASS** HTTP 200 RTL `Sooqna \| سوقنا` |
| Login | **PASS** `/login` 200; `POST /api/auth/login/password` demo user **200** `ok: true`; `/api/auth/me` 200 |
| Password Reset | **PASS** `/forgot-password` 200; `POST /api/auth/password/reset/request-link` 200 generic ok (OTP path remains product `FEATURE_DISABLED` historically; link path is live) |
| Search | **PASS** `/search` and `/search?q=كامري` 200 |
| Orders | **PASS** `/orders` 200; `GET /api/orders?userId=demo-user-001` 200 with orders list |
| Admin | **PASS** unauth 307 → `/login?next=%2Fadmin`; admin demo login 200 role `admin`; `/admin` 200 dashboard (not login form) |
| Notifications | **PASS** unauth 401; authed 200 |
| Smart Filters | **PASS** `/search` 200 (filters shipped on `main` via #8) |
| Buy Again | **PASS** code on Production SHA from #13; orders API live |
| Cron | **PASS fail-closed** route exists; **ops gap** `CRON_SECRET` missing (503) |

**SOOQNA: PASS** (product live on canonical SHA; cron secret still an owner ops action)

### AVIATORPASS

| Check | Result |
|---|---|
| Homepage | **PASS** 308 apex → www 200 `Aviator Pass \| Complete Aviation Education Platform` |
| Login | **PASS** `/login` 200; CSRF on API is **configured** (403 without token) |
| Core booking/purchase | **PASS** `/courses` 200 catalog; `/checkout` 200 “Secure checkout — Enrol in Aviator Pass” |
| Admin | **PASS** `/admin` → login gate |
| Payment configuration | **PASS** Stripe webhook endpoint validates signatures; Tamara/Taly documented on this product only |

**AVIATORPASS: PASS** (health JSON `degraded` only for local file storage)

GUI browser MCP was not available in this VM; checks used live HTTPS + authenticated JSON APIs.

---

## FINAL REPORT

**ACTIVE PROJECTS: 2**

### 1. SOOQNA
- **Repository:** `dukkanify/sooqna.site`
- **Branch:** `main`
- **Vercel:** `sooqna`
- **Domain:** https://sooqna.site
- **Production SHA:** `6e51fa75068833af13441b5710351116ab9c1fae` (matches `origin/main`)
- **Status:** **PASS**

### 2. AVIATORPASS
- **Repository:** `dukkanify/AviatorPass`
- **Branch:** `main`
- **Vercel:** `aviatorpass`
- **Domain:** https://aviatorpass.com/ → https://www.aviatorpass.com/
- **Production SHA:** `4694e02d2f06b9c2447801eaa5c9256c55ec7d3c` (matches live `/api/health`)
- **Status:** **PASS**

### UAE-SALES
- **Classification:** LEGACY SOOQNA SOURCE
- **Action:** ARCHIVE / READ-ONLY (not hard-deleted)

### CURSOR
- **Sessions before:** 42 (this Sooqna Cloud environment)
- **Safe sessions closed:** 0 (no close API)
- **Sessions remaining:** 42
- **Safe-to-close classified:** 38 idle smoke/review sessions listed above
- **Keep:** this run; `new update` (UNKNOWN); cloud-agent unique-branch session

### GIT
- **Sooqna branches:** 6 remote (`main`, 2 golden backups, PR #14, PR #7, 1 UNKNOWN)
- **AviatorPass branches:** 45 remote (`main` KEEP; 9 SAFE_DELETE candidates; 35 UNKNOWN leftovers)
- **Legacy branches:** UAE-Sales historical Sooqna `-37ba` + AviatorPass `aep-*` / `-0987` (archive inventory)
- **Unknown branches:** Sooqna `cursor/cloud-agent-1789220497826-047vw`; AviatorPass leftover `ahead > 0` list; tag `ismail-اسماعيل`

### VERCEL
- **Active projects:** `sooqna`, `aviatorpass`
- **Legacy projects:** `uae-sales` (404)
- **Unknown projects:** other client `*.vercel.app` sites + any unlisted Vercel projects (MCP unauthenticated)

### DATA
- **Sooqna Production safe:** **YES** (no cleanup this run)
- **AviatorPass Production safe:** **YES** (no cleanup this run)
- **Cross-project DB dependency:** **NOT OBSERVED** (different store names; URL equality UNKNOWN)
- **Cross-project Stripe dependency:** **NOT OBSERVED** (different webhook paths/products)
- **Cross-project deploy dependency:** **NO** (separate GitHub repos, separate Vercel aliases, separate Production SHAs)

---

## FINAL TARGET

```
ACTIVE PROJECTS = 2
SOOQNA: PASS
AVIATORPASS: PASS
PROJECT ISOLATION: PASS
PRODUCTION DATA SAFE: PASS
NO REQUIRED WORK LOST: PASS
NO CROSS-PROJECT DEPENDENCY: PASS
```

Owner follow-ups (not done, need explicit approval):
1. GitHub **Archive** on `dukkanify/UAE-Sales` (read-only)
2. Optionally delete AviatorPass **SAFE_DELETE** leftover branches (ahead = 0 only)
3. Inspect Sooqna UNKNOWN branch `cursor/cloud-agent-1789220497826-047vw` before any delete
4. Close classified Cursor smoke sessions in the Cursor UI
5. Set Sooqna Production `CRON_SECRET` and redeploy (value never invented here)
6. Authenticate Vercel MCP if a complete Vercel project/env inventory is required
7. Do not treat other-client repos (Wateen, Esnaad, Pegasus) as Sooqna/AviatorPass clutter
