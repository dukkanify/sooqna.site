# Sooqna — Final Consolidation Report

**Date (UTC):** 2026-09-14  
**Canonical repo:** `dukkanify/sooqna.site`  
**Canonical branch:** `main`  
**Vercel project:** `sooqna`  
**Production:** https://sooqna.site  

Nothing was deleted in this run (branches, historical Markdown, UAE-Sales, AviatorPass). `CRON_SECRET` was not invented.

---

## Scorecard (requested fields)

| Item | Result |
|---|---|
| **PR #4** | **PASS — merged** https://github.com/dukkanify/sooqna.site/pull/4 as `6fdaef6` (`fix: show logout on mobile dashboard (#4)`) |
| **Mobile Logout** | **PASS** — mobile nav chip + full-width card; session clears to `/login`; desktop sidebar unchanged; EN `Sign out` via LocalizedTree |
| **Smart Filters** | **PASS** — PR **#8** merged; live on Production `c6f3f49` |
| **Cars Make→Model** | **PASS** — Toyota models only; Nissan clears Camry; URL `spec_brand` / `spec_model` |
| **Phones Brand→Model** | **PASS** — Apple → iPhone models; URL `spec_brand` / `spec_model` |
| **Real Estate Emirate→Area** | **PASS** — دبي → جميرا / Marina / etc.; purpose + property type present |
| **Services Category→Subservice** | **PASS** — subcategory (تنظيف…) + `serviceCategory` / coverage area |
| **Jobs** | **PASS** — vacancy vs seeker; employment type appears for vacancy |
| **All Categories Audited** | **PASS** — all 13 mock categories; dynamic keys for 8 fielded categories; others use subcategory + generic emirate/price/condition |
| **Categories Skipped** | **0** |
| **CRON_SECRET** | **OWNER ACTION REQUIRED** — Production `cronSecretConfigured = false`, `missing: ["CRON_SECRET"]`. Vercel CLI on this VM is logged out; Vercel MCP `needsAuth`. Value was not invented. |
| **Unauthorized Cron** | **FAIL vs 401 target** — `GET/POST https://sooqna.site/api/cron/dispute-reminders` → **503** `{ error: "CRON_SECRET_REQUIRED" }` because the secret is unset. Route still maps mismatch → 401 **once configured**. |
| **Authorized Cron** | **NOT RUN** — no secret available; would succeed only after owner sets Production `CRON_SECRET` and redeploys |
| **Marketplace CTA** | **PASS** — Production homepage CTAs; listing primary CTA `تواصل مع البائع` on `honda-civic-2020-018` |
| **Phone/WhatsApp** | **PASS** — Production listing shows `tel:` and واتساب / `wa.me` |
| **Purchase Eligibility** | **PASS (code + listing chrome)** — `shared/listings/purchase-eligibility.ts` / escrow copy on live listing; full checkout not re-purchased this run |
| **Admin Dashboard** | **PASS (gate)** — `/admin` → 307 `/login?next=%2Fadmin`; login form renders. Authenticated ops cockpit not re-walked while logged in this run |
| **Madmoon** | **PASS (code + listing copy)** — `requiresProductConditionVerification` on main; listing shows verification/escrow chrome. Dedicated named branch still does not exist |
| **Notifications** | **PASS (route)** — `/notifications` HTTP 200. Push/bell deep-link not re-authenticated this run |
| **26 Requirements** | **PARTIAL** — traceability doc still on main (`docs/SOOQNA_26_ISSUES_TRACEABILITY.md`); homepage/listing/search/admin/logout/filters smoked. Full 26-item E2E matrix was **not** re-executed |
| **Markdown Reports Archived** | **NO — blocked** (archive gate requires Production regression including Cron = PASS) |
| **Reports Deleted** | **0** |
| **Remote Branches Before** | **15 named refs** (plus `origin/main`) listed below |
| **Remote Branches Deleted** | **0** |
| **Remote Branches Remaining** | **15 named refs** (same set; none deleted) |

### FINAL RESULT flags

| Flag | Value |
|---|---|
| ONE SOURCE OF TRUTH | **PASS** — `dukkanify/sooqna.site` `main` → Vercel `sooqna` → https://sooqna.site |
| ALL APPROVED FEATURES ON MAIN | **PASS** (product code) — logout + smart filters on main. Cron **config** is not on Production |
| PRODUCTION = MAIN | **PASS** — Production SHA **is** `origin/main` tip |
| SMART FILTERS | **PASS** |
| CRON | **FAIL** — secret missing; unauthorized is 503 not 401 |
| HISTORICAL DOCS ARCHIVED | **FAIL** (not started — Cron gate) |
| UNNECESSARY MERGED BRANCHES CLEANED | **FAIL** (inventory only; no deletes) |
| NO UNIQUE WORK LOST | **PASS** — no branch or file deleted |

**Overall FINAL RESULT: not all flags true.** Owner must set Production `CRON_SECRET`, redeploy, then archive docs and delete only the proven `SAFE_DELETE` list.

---

## 1. PR #4 — Mobile logout

- Inspected diff: **only** `features/dashboard/components/DashboardShell.tsx` (+23/−5).
- Rebased onto `origin/main` `6a2366c`, force-pushed `f8cf425`, undrafted.
- Local: `npm run lint` PASS, `npm test` 20/20, `npm run build` PASS, `npm run verify:isolation` PASS.
- Browser: mobile 390×844 Arabic logout chip + under-content button; click clears session (`/profile` → `/login?next=…`); desktop sidebar logout; EN dictionary `تسجيل الخروج` → `Sign out`.
- Vercel Preview SUCCESS, then squash-merge `6fdaef6` on main (GitHub also recorded merged at 2026-09-14T07:34:48Z).

---

## 2. Smart category search filters

**PR:** https://github.com/dukkanify/sooqna.site/pull/8  
**Commits on main:** `eabc032` + `c6f3f49`  
**Preview:** Vercel SUCCESS, then FF-merged to `main`.

Server-side `queryListings` / `countMatchingListings` apply `categorySpecs`, ranges, subcategory, and area. URL keys: `spec_*`, `min_*`/`max_*` (except price), `subcategory`, `area`. Parent brand/listingType clears invalid children. Mobile drawer has Apply + Reset. Counts come from SQL/`COUNT(*)` plus local seller overlay — not a full-catalog client filter.

Electronics **Type** uses real `category.subcategories`, not a fabricated Type list. Service **subservice** is the real `serviceCategory` text field.

---

## 3. CRON_SECRET (Production only)

Live `GET https://sooqna.site/api/auth/status`:

- `ok: true`
- `cronSecretConfigured: false`
- `missing: ["CRON_SECRET"]`

Live cron route (no credentials sent; response body has no secret):

- **503** `CRON_SECRET_REQUIRED`

`app/api/cron/dispute-reminders/route.ts` is unchanged in intent:

- secret set + mismatch → **401**
- secret missing in `NODE_ENV=production` → **503**
- secret set + match → `processDisputeReminders()` (schedule still `vercel.json` → `/api/cron/dispute-reminders`)

**Owner action:** set Production env `CRON_SECRET` on Vercel project `sooqna` (Production only), redeploy Production, then confirm `cronSecretConfigured = true`, unauthorized **401**, authorized success.

---

## 4. Quality gates (smart-filters revision, also on current main)

| Gate | Result |
|---|---|
| `npm run lint` | PASS |
| `npm test` | **26/26** PASS (auth + integrity + smart-filters) |
| `npm run build` | PASS (pre-existing Turbopack NFT warning via `next.config.ts` → payments data-store; Cache-Control warning on `/_next/static`) |
| `npm run verify:isolation` | PASS |

Production smoke (this run, SHA `c6f3f49`): homepage, listing phone/WhatsApp/CTA, cars Toyota filter URL, admin login gate.

---

## 5. Historical Markdown — not archived

Identified **66** root `*_REPORT.md` files (93 root `*.md` total). Previous inventory cited 74 historical reports including non-`_REPORT` superseded docs.

**Not moved** to `docs/archive/` because Production Cron is not PASS. **Deleted: 0.**

Keep in place until Cron is green, then move superseded reports only (git mv, keep history).

---

## 6. Branch inventory (no deletes)

Fetched `origin --prune` **after** PR #4 and PR #8 landed on `main`.

`git merge-base --is-ancestor <branch> origin/main` (or squash-content proof).

### KEEP

| Branch | Proof |
|---|---|
| `main` | Canonical |
| `cursor/add-cloud-env-76f4` | Unique `.cursor/environment.json` (ahead 4) — **do not delete** |

### SAFE_DELETE (proven on main — **not deleted this run**)

Ancestry (`ahead=0`, ancestor of `origin/main`):

- `cursor/smart-category-search-filters-f438` (`c6f3f49`)
- `feature/admin-dashboard-redesign`
- `fix/listing-intent-ctas`
- `fix/marketplace-purchase-eligibility`
- `integrity/final-delivery`
- `ismail-اسماعيل`
- `perf/production-optimization`
- `qa/26-homepage-copy-fixes`

Squash content already on main (not ancestor of the squash commit, but required files are on main):

- `cursor/mobile-logout-visibility-9223` — DashboardShell mobile logout = PR #4
- `cursor/source-of-truth-inventory-f438` — inventory report = PR #6

### UNKNOWN (do not delete)

- `cursor/fix-login-clarity-f438` — login copy is on main via #5; extra revert/add cloud-env commits overlap `add-cloud-env-76f4`
- `cursor/fix-password-reset-login-9223` — PR #3 squash on main; leftover commits not ancestry-proven
- `cursor/cloud-agent-1789220497826-047vw` — UI tweaks vs current main not fully proven equivalent

### Exact remaining remote branch names

```
cursor/add-cloud-env-76f4
cursor/cloud-agent-1789220497826-047vw
cursor/fix-login-clarity-f438
cursor/fix-password-reset-login-9223
cursor/mobile-logout-visibility-9223
cursor/smart-category-search-filters-f438
cursor/source-of-truth-inventory-f438
feature/admin-dashboard-redesign
fix/listing-intent-ctas
fix/marketplace-purchase-eligibility
integrity/final-delivery
ismail-اسماعيل
main
perf/production-optimization
qa/26-homepage-copy-fixes
```

**Deleted branch names:** *(none)*

---

## 7–8. Post-cleanup / canonical identity

| Field | Value |
|---|---|
| Canonical repository | `dukkanify/sooqna.site` |
| Canonical branch | `main` |
| Vercel | `sooqna` |
| Domain | https://sooqna.site |
| **Origin Main SHA** | `c6f3f49d9cb0672d6d60949e4f918fc5598ebfaf` |
| **Production SHA** | `c6f3f49d9cb0672d6d60949e4f918fc5598ebfaf` |
| Production reachable from origin/main | **YES** (identical tip) |
| **Deployment ID** | GitHub Production deployment `6434194843` (created 2026-09-14T09:29:04Z, state success) |
| Vercel alias recorded | `https://sooqna-c9ky0vkyu-dukkanify-technology-llcs-projects.vercel.app` |

No deleted branches, so no feature depends on a deleted branch.

AviatorPass: not touched (`verify:isolation` PASS). UAE-Sales: not touched.

---

## Next owner actions

1. Set Vercel Production `CRON_SECRET` on project `sooqna` (do not paste it into git/chat).
2. Redeploy Production.
3. Confirm `cronSecretConfigured = true`, unauthorized cron **401**, authorized cron **200/ok**.
4. Then: move historical reports to `docs/archive/` (no deletes), re-run lint/test/build, then delete only the **SAFE_DELETE** list above.
