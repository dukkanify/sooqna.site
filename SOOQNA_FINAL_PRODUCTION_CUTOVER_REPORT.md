# Sooqna — Final Production Cutover Report

**Date:** 2026-09-08  
**Vercel project:** `sooqna` (`prj_57Tx2amGrhbopE69uXsYPPwcDFLL`)  
**Action:** Retarget Git from `dukkanify/UAE-Sales` to `dukkanify/sooqna.site` and ship Production from the approved Preview lineage.

AviatorPass was not modified. UAE-Sales was not deleted. Secrets were not rotated. Env values were not changed.

---

Dedicated repo: **PASS**  
Vercel Git retarget: **PASS**  
Production branch: **PASS**  
Production deployment: **PASS**  
sooqna.site on new repo: **PASS**

Auth:  
Register→Verify→Logout→Login: **PASS**  
Password reset: **PASS**

Listings: **PASS**  
Admin: **PASS**  
Notifications: **PASS**  
Live data: **PASS**  
DB isolation: **PASS**  
Email isolation: **PASS**  
Stripe isolation: **PASS**  
Cron isolation: **PASS**  
AviatorPass dependency: **NONE**

Production commit: `320c0af39732cbe6bbcf1b3314b17dc0b85f85a8`  
Deployment ID: `dpl_2dqjM4LYG6zEjKn2Qq8mpXhu6JjW`  
Git repository: `dukkanify/sooqna.site`  
Production domain: `https://sooqna.site`

---

## Final verdict

**PROJECTS FULLY ISOLATED — PRODUCTION CUTOVER COMPLETE**

---

## 1. Pre-cutover

| Check | Result |
|---|---|
| Dedicated repo | `dukkanify/sooqna.site` |
| Branch | `main` |
| Approved commit | `320c0af` (Git-backed Preview READY) |
| Isolation | `npm run verify:isolation` PASS |
| Production before cutover | `dukkanify/UAE-Sales` @ `0986a2f` |
| Domain | `https://sooqna.site` verified on project `sooqna` |

`238caf8` remains an ancestor of `320c0af`.

## 2–5. Git retarget and Production

Git integration on existing project `sooqna` (same project ID):

- From: `dukkanify/UAE-Sales` `main`
- To: `dukkanify/sooqna.site` `main`

Production deployment:

- ID: `dpl_2dqjM4LYG6zEjKn2Qq8mpXhu6JjW`
- Source: GitHub `dukkanify/sooqna.site` `main` @ `320c0af`
- `target`: production
- `readyState`: READY
- Aliases assigned: `sooqna.site`, plus Vercel production aliases
- Deployment URL: `https://sooqna-7e19nrifu-dukkanify-technology-llcs-projects.vercel.app`

Live project metadata after cutover:

- Git: `dukkanify/sooqna.site` branch `main`
- Production SHA: `320c0af39732cbe6bbcf1b3314b17dc0b85f85a8`
- Production repo: `dukkanify/sooqna.site`

`www.sooqna.site` does not resolve in DNS. DNS was not changed.

## 6. Live smoke

All 200, no 500/503, homepage `عاجل` = 0:

`/`, `/login`, `/register`, `/search`, `/categories`, `/featured`, `/listings/new`, `/admin`, `/notifications`, listing detail.

Fonts loaded (`variable` / Plex class present). Production build did not fail on Google Fonts. No typography code change.

## 7–8. Auth, listings, admin, notifications (LIVE `https://sooqna.site`)

Fresh mailbox:

1. Register 200, OTP delivered, Verify 200  
2. Logout → login same password 200  
3. Forgot password → reset email on `sooqna.site` → confirm 200 → old password 401 → new password 200  

Listing:

1. Create 201 `pending_review` with uploaded PNG  
2. Visible to admin; status filters distinguish pending / active / rejected  
3. Approve → published 200 with image + Featured  
4. Reject path 200 `rejected`  
5. Public search finds the listing  

Notifications persist after logout/login; unread → mark read → history remains; deep links not 404.

## 9. Data integrity

- Mock seed listings: 0  
- Urgent absent on home / cards / search / detail  
- Featured DB-backed and visible  
- Real Postgres listings and uploaded media  

## 10. Environment isolation

`/api/auth/status` on live:

- Postgres durable  
- Resend configured  
- `appUrl` = `https://sooqna.site`  
- Session configured  
- Demo OTP off  
- No AviatorPass keys or payload  

Project env key names (values not printed): Neon `DATABASE_*`, `RESEND_API_KEY`, `SESSION_SECRET`, `CRON_SECRET`, email from/provider. No AviatorPass names. No `STRIPE_*` keys on this project (unchanged; not copied from another product). Cron job definition remains Sooqna `/api/cron/dispute-reminders`.

## 11. Fonts

Approved Production build `dpl_2dqjM4LYG6zEjKn2Qq8mpXhu6JjW` reached READY. The earlier Google Fonts failure was a hung local sandbox build, not this Production deploy. No font code change.

## 12. Old repo

`dukkanify/UAE-Sales` is **legacy and no longer the Vercel Production Git source**. Branches were not deleted.

## Quality

- `npm run lint` PASS  
- `npm test` 6/6 PASS  
- `npm run verify:isolation` PASS  
