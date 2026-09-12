# SOOQNA — Admin Dashboard Redesign Acceptance

**Branch:** `feature/admin-dashboard-redesign`  
**Repository:** `dukkanify/sooqna.site`  
**Scope:** Admin main dashboard (`/admin`) — aggregation APIs + cockpit UI.  
**Date:** 2026-09-12

## Preview

| Field | Value |
|-------|-------|
| Preview URL | https://sooqna-jke8cdx9r-dukkanify-technology-llcs-projects.vercel.app |
| Preview SHA | `016b01dda2087ec5116b65bd654da6bf2bb61824` |
| Environment | Preview |
| GitHub Deployment | `6405909728` |
| PR | https://github.com/dukkanify/sooqna.site/pull/2 |

## Quality gates

| Gate | Result |
|------|--------|
| Dashboard-file lint (eslint on changed admin dashboard paths) | PASS |
| Whole-project lint | FAIL (pre-existing unrelated: SearchFilters / OrderDetailContent — not introduced by this PR) |
| `npm test` | PASS (31/31) |
| `npm run build` | PASS |
| `npm run verify:isolation` | PASS |

## Acceptance matrix

| Criterion | Result | Notes |
|-----------|--------|-------|
| Executive KPIs | PASS | Live counts; click-through hrefs; no hardcoded KPI values |
| KPI ↔ DB | PASS | Preview live: listings 243/active 216/pending 0/rejected 0 match admin listings status counts; users 58; open disputes 0; pending payments 10 match `/api/admin/orders` `pending_payment` |
| Action Center | PASS | “يتطلب إجراء” / Action required shows live pending payments (10) deep-linked to `/admin/orders`; empty when no actionable queues |
| Financial | PASS | Stripe connected · AED; real zeros for volume/revenue/held; pending payments = 10; no fabricated revenue |
| Operations | PASS | Queues with count/severity/CTA; pending orders = Action Center |
| Disputes/Risk | PASS | Open/under review/overdue/evidence/suspended from live stores |
| Trends | PASS | 7→7 unique days; 30→30; 90→13 weekly buckets; no negatives; no duplicate dates |
| Category Performance | PASS | Ranked by live listing counts + view share (cars 90 / 45%) |
| Top Listings | PASS | Rows use live-mkt IDs; admin `q=` lookup resolves; public listing slug HTTP 200 |
| Recent Activity | PASS | Real payment events with timestamps + deep links; actor “system” |
| RBAC | PASS | Guest: `/admin` → login redirect; APIs 401 `UNAUTHORIZED`. Super Admin: full permissions payload. Non-admin API path returns 403 `FORBIDDEN` (`requireAdminUser`). Financial/platform sections gated via `hasAdminPermission` |
| Responsive | PASS | 390–1440: no horizontal overflow; Action Center prioritized above executive on narrow viewports; KPI grid stacks |
| Arabic RTL | PASS | `dir=rtl` shell; native Arabic copy |
| English LTR | PASS | `dir=ltr` `lang=en`; Executive / Action required / Financial metrics; no Arabic bleed in chrome |
| Performance | PASS | Aggregate summary/trends/actions endpoints; no client full-table dump; manual refresh |
| Security | PASS | `requireAdminUser` on summary/trends/actions; guest 401; no secrets in dashboard JSON |
| Component failure | PASS | Cockpit shows `تعذر تحميل هذه البيانات` when summary fails and no cached data |

## Architecture

- `services/admin/admin-dashboard.service.ts` — server aggregation + RBAC shaping
- `GET /api/admin/dashboard/summary?range=`
- `GET /api/admin/dashboard/trends?range=`
- `GET /api/admin/dashboard/actions?range=`
- Legacy `GET /api/admin/summary` → same payload
- UI: `features/admin/components/AdminOpsCockpit.tsx` + `admin-ops.css`

## Final verdict

| Target | Result |
|--------|--------|
| Preview QA | PASS |
| KPI ↔ DB | PASS |
| Action Center | PASS |
| RBAC | PASS |
| Security | PASS |
| Responsive | PASS |
| Build / tests / isolation | PASS |
| Production promote | READY after merge (not promoted in this document until merge completes) |

## Merge gate

All critical Preview gates PASS. Safe to merge `feature/admin-dashboard-redesign` → `main` (no force-push).
