# Sooqna P0 Pre-Cutover Acceptance Report

**Date:** 2026-09-08  
**Scope:** Git-backed Preview from `dukkanify/sooqna.site` `main` only. Production was not retargeted, promoted, or redeployed.

---

Repository: dukkanify/sooqna.site  
Branch: main  
Commit: 320c0af39732cbe6bbcf1b3314b17dc0b85f85a8  
Preview URL: https://sooqna-awzjiuzs2-dukkanify-technology-llcs-projects.vercel.app  
Git-backed Preview: PASS

Deployment: `dpl_DJhatgQcbTe1EssyemXhfFaGgm6Z`  
Git metadata:

- `gitSource.type`: github  
- `gitSource.ref`: main  
- `gitSource.sha`: 320c0af39732cbe6bbcf1b3314b17dc0b85f85a8  
- `meta.githubOrg` / `meta.githubRepo`: dukkanify / sooqna.site  
- `meta.githubDeployment`: 1  
- OIDC environment: preview  
- `238caf8` remains an ancestor of HEAD  

Acceptance was **not** run against CLI archive Previews with an empty Git SHA.

OTP delivery: PASS  
Register → Verify: PASS  
Logout → Login same credentials: PASS  
Password Reset: PASS

Mock listings before: 100  
Mock listings after: 0  
Mock business data: PASS

Urgent homepage: PASS  
Urgent listing cards: PASS  
Urgent listing detail: PASS  
Featured preserved: PASS

Admin new user: PASS  
Pending listing: PASS  
Admin approval: PASS  
Notifications: PASS  
Deep links: PASS  
Published listing: PASS  
Uploaded image: PASS

lint: PASS  
tests: PASS  
isolation: PASS  
build: PASS

Production changed: NO

---

## FINAL VERDICT

**READY FOR PRODUCTION CUTOVER**

---

## Evidence (Git-backed Preview `320c0af`)

### Runtime

- `/api/auth/status`: 200  
- Postgres durable auth/catalog  
- Resend configured  
- Demo OTP server/client: false / false  
- `appUrl` = Preview host (not `https://sooqna.site`)  
- No AviatorPass in status payload  
- Stripe Preview env: unset (honest; not copied from Production)  
- `CRON_SECRET` Preview: unset  

### P0-2 OTP / email

Fresh mail.tm inbox (`uberip.com`):

1. Register 200, `emailDelivered: true`, OTP not revealed to client  
2. OTP email arrived (no plaintext logged)  
3. Verify 200, account `active`, `emailVerifiedAt` set  
4. Logout 200  
5. Login same email/password 200 authenticated  

Demo OTP was not enabled.

### P0-3 Password reset

1. Forgot-password 200  
2. Reset email arrived with Preview host in the link (not live `sooqna.site`)  
3. Confirm 200  
4. Old password 401 `INVALID_CREDENTIALS`  
5. New password login 200  

### P0-4 Mock business data

Identification (safe; never matches genuine user ids):

- `listing-(car|re|mob|elec|furn|svc|job|fashion|pets|kids|books|sports|food)-NNN`  
- `listing-extra-N`  
- `user-listing-NNN`  

Genuine ids left untouched: `local-*`, `admin-*`, `e2e-*`.

First Git-backed Preview catalog (shared Postgres): **100** seed rows, **3** genuine.  
Admin `POST /api/admin/listings/purge-seed`: removed 100, remaining seed 0.  
Later Preview re-check: mock = 0. Search suggest `mercedes` returned 0 mock G63 hits.

Automatic seed injection is disabled on Vercel / `NODE_ENV=production` unless `ALLOW_MOCK_CATALOG=true`.

### P0-5 Urgent vs Featured

Against the Git-backed Preview:

- Homepage `عاجل` = 0  
- Listing cards `عاجل` = 0  
- Listing detail `عاجل` = 0  
- Search HTML `عاجل` = 0  
- No user-facing Urgent filter/label  

`isUrgent` remains only as an optional type field so old JSON does not crash. Search RSC may still serialize `isUrgent:false` on listing objects; that is not a filter option.

Featured / مميز remains DB-backed (`is_featured` + payload `isFeatured`). After approval with `isFeatured: true`, listing detail showed مميز and `/featured` stayed functional.

### P0-6 Authenticated listing / admin / notifications

1. Create listing 201 `pending_review` with uploaded PNG persisted in payload  
2. User notifications created; unread; deep links 200  
3. Admin: new user visible; pending listing visible  
4. Admin approve → `active` + featured  
5. Public `/listings/{slug}` 200 (not “الإعلان غير موجود”)  
6. Uploaded image present on the published page  
7. After logout/login, notifications persist; approval notification deep link 200  

A follow-up commit (`7fdfc16` / `320c0af`) fixed stale in-memory catalog on Vercel so newly approved listings resolve from Postgres by slug.

### P0-7 Quality

- `npm run lint`: PASS  
- `npm test`: 6/6 PASS  
- `npm run build`: PASS  
- `npm run verify:isolation`: PASS (no AviatorPass files/config)  

### Production (unchanged)

- Vercel project `sooqna` Git link remains `dukkanify/UAE-Sales` `main`  
- Production SHA remains `0986a2f471392e10d9d7b227a1019b370744c6ad`  
- Live `https://sooqna.site` was not promoted, aliased, or retargeted  
- UAE-Sales was not deleted  
- AviatorPass was not modified  

---

## Out of scope / honest gaps

- Stripe and `CRON_SECRET` are not set on Preview (not copied blindly from Production).  
- Preview writes to the shared Sooqna Postgres used by live. Seed purge removed confirmed mock catalog rows from that database. Genuine `local-*` / `admin-*` / `e2e-*` rows were not deleted.
