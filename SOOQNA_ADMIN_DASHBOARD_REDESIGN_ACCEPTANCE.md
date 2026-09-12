# SOOQNA — Admin Dashboard Redesign Acceptance

**Branch:** `feature/admin-dashboard-redesign`  
**Scope:** Admin main dashboard (`/admin`) only — aggregation APIs + cockpit UI.  
**Date:** 2026-09-12

## Quality gates

| Gate | Result |
|------|--------|
| `npm run lint` | PASS for dashboard files (repo has pre-existing errors in unrelated SearchFilters / OrderDetailContent) |
| `npm test` | PASS (31/31) |
| `npm run build` | PASS |
| `npm run verify:isolation` | PASS |

## Acceptance matrix

| Criterion | Result | Notes |
|-----------|--------|-------|
| Executive KPIs | PASS | Live counts from listings/users/orders/disputes; click-through links; no hardcoded KPI values |
| Platform Metrics | PASS | Totals, published, pending, rejected, users, new users, views, favorites; hidden when no permission |
| Financial Metrics | PASS | Volume/revenue/held Madmoon/payments from orders; Stripe-unavailable message when not configured |
| Operations | PASS | Review queues with count, severity, oldest age, action CTA |
| Action Center | PASS | Priority-sorted “يتطلب إجراء” deep links only when count > 0 |
| Disputes/Risk | PASS | Open/under review/overdue escrow/evidence/suspended; severity badges |
| Trends | PASS | Real paid-order series; 7/30/90; weekly buckets for 90d; empty state when no data |
| Category Performance | PASS | Ranked by listing count + view share from live listings |
| Top Listings | PASS | Ranked by views/favorites with admin deep links |
| Recent Activity | PASS | Compact audit + payment events (max 12) |
| RBAC | PASS | Financial/platform/queues/shortcuts gated via `hasAdminPermission` |
| Responsive | PASS | Stacked KPIs, Action Center first on mobile, table scroll, 768–1440 CSS |
| Arabic RTL | PASS | Native Arabic copy + RTL table alignment |
| English LTR | PASS | `LocalizedTree` + new `phrases.en.json` entries |
| Performance | PASS | Single `/api/admin/dashboard/summary` aggregation; no client full-table dump; manual refresh |
| Security | PASS | `requireAdminUser` on summary/trends/actions (+ legacy `/api/admin/summary`) |

## Architecture

- `services/admin/admin-dashboard.service.ts` — server aggregation
- `GET /api/admin/dashboard/summary?range=`
- `GET /api/admin/dashboard/trends?range=`
- `GET /api/admin/dashboard/actions?range=`
- Legacy `GET /api/admin/summary` → same payload
- UI: `features/admin/components/AdminOpsCockpit.tsx` + `admin-ops.css`

## Final verdict

| Target | Result |
|--------|--------|
| SOOQNA ADMIN DASHBOARD | PASS |
| OPERATIONAL VISIBILITY | PASS |
| ACTIONABILITY | PASS |
| RESPONSIVE | PASS |
| PERFORMANCE | PASS |
| PRODUCTION READY | PASS (code) — preview/production deploy IDs below |

## Deployment

| Field | Value |
|-------|-------|
| Branch | `feature/admin-dashboard-redesign` |
| Commit SHA | `9bf29186974b5566cb1ad8967efe3902829af2d4` |
| Remote | https://github.com/dukkanify/sooqna.site/tree/feature/admin-dashboard-redesign |
| PR draft link | https://github.com/dukkanify/sooqna.site/pull/new/feature/admin-dashboard-redesign |
| Production SHA | _not promoted — preview-first_ |
| Deployment ID | _pending Vercel team auth / auto-preview from branch push_ |
| Domain | sooqna.site (production unchanged); preview URL appears on the branch after Vercel builds |

Branch pushed to `origin`. Open the PR link above (or Vercel dashboard) to grab the preview Deployment ID once the build finishes.

1. Sign in as Super Admin → `/admin` shows all sections with live numbers.
2. Payments-only admin → financial visible; listings queues hidden as per permissions.
3. Content moderator → listings/users queues; no financial block.
4. Guest → redirected / 401 on APIs.
5. Pending listings KPI equals `/admin/listings?status=pending_review` count.
6. Open disputes KPI equals disputes open count.
7. With Stripe off and mock off → financial unavailable message (no fake zeros).
