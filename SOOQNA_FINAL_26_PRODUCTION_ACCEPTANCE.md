# Sooqna — Final 26/26 Production Acceptance

**Date:** 2026-09-08  
**Repository:** `dukkanify/sooqna.site`  
**Branch:** `main`  
**Verified Production commit:** `c3dafb0bae1cc3db1a225f90d88a92e316a68015`  
**Deployment ID:** `dpl_CmaBj5BtxcHgKVqxN29hPrWKFVqL`  
**Vercel project:** `sooqna`  
**Domain:** `https://sooqna.site`  
**AviatorPass:** NONE  

Live Production is the acceptance source of truth. Code inspection alone was not used to mark PASS.

---

## Table

| ID | Requirement | Before | Fix | Preview | LIVE | Evidence | Final |
|----|-------------|--------|-----|---------|------|----------|-------|
| 01 | Repeated login with same credentials | Working on prior P0 | None | n/a | Register → OTP → verify → logout → login → logout → login | LIVE APIs 200; OTP not revealed in JSON | **PASS** |
| 02 | Password-reset email | Working Resend path | None (test used wrong JSON field once) | n/a | Reset email in 6.3s; subject `إعادة تعيين كلمة المرور — سوقنا`; URL `sooqna.site`; valid token | Recipient mailbox; Sooqna branding; no AviatorPass template | **PASS** |
| 03 | Cars model / year | LIVE schema combobox | None | n/a | Model `Patrol` selectable; year `1988` typed/manual persisted | `GET /api/category-fields?categoryId=cars`; listing specs | **PASS** |
| 04 | Cars condition New/Used only | Schema new/used | None | n/a | Options `new`/`used` only; search condition الكل/جديد/مستعمل; detail has no ممتاز | LIVE schema + `/search` + car detail | **PASS** |
| 05 | Cars precise location | Emirate + city fields | None | n/a | Emirate أبوظبي + الكورنيش persisted; map + title display | Listing `/listings/qa26-car-be50a099` | **PASS** |
| 06 | Cars Other color | Schema showWhen أخرى | None | n/a | `exteriorColor=أخرى`, `exteriorColorOther=نيلي ملكي` persisted | Listing categorySpecs + page HTML | **PASS** |
| 07 | Listing cover image | Form «تعيين كغلاف» reorders to index 0 | None | n/a | Cover PNG is `images[0]` and `imageUrl`; gallery image 1/2 | LIVE create + listing gallery | **PASS** |
| 08 | Car keys optional | `numberOfKeys.required=false` | None | n/a | Create succeeded with keys omitted | Listing 201 pending_review | **PASS** |
| 09 | Video in gallery | Gallery already embeds YouTube | None | n/a | `videoUrl` saved; gallery 3/3 YouTube embed plays | LIVE screenshot of gallery video | **PASS** |
| 10 | Notification deep links | hrefs to listing/dashboard | None | n/a | 10 hrefs → HTTP 200, no 404/5xx | `/api/notifications` then GET each href | **PASS** |
| 11 | Admin pending listings | Queue on upsert | None | n/a | New pending car + furniture visible in admin listings | `GET /api/admin/listings` | **PASS** |
| 12 | Admin new users | Users API | None | n/a | Fresh registered email present among admin users | `GET /api/admin/users` | **PASS** |
| 13 | Admin listing search/filter | Client filters on admin payload | None | n/a | Search by QA suffix hit 7; pending filter 7; furniture category 1 | Same filter logic as AdminListingsPanel | **PASS** |
| 14 | Real estate developer name | Combobox named developers | None | n/a | Saved/displayed `Aldar` (not a numeric id) | Listing `/listings/qa26-re-be50a099` | **PASS** |
| 15 | Electronics New/Used only | Schema new/used | None | n/a | Options `new`/`used`; listing created `used` | LIVE electronics fields + create | **PASS** |
| 16 | Notification history | Durable store | None | n/a | 15 notifications; mark-read; persist after logout/login | `/api/notifications` across sessions | **PASS** |
| 17 | Phone date picker | `purchaseDate` type date | None | n/a | Native `date` field; `2026-01-15` persisted | LIVE mobiles schema + listing specs | **PASS** |
| 18 | Furniture Other approval | Other → pending_review | None | n/a | Create pending → admin approve → published page | Option suggestion also accepted | **PASS** |
| 19 | Jobs vacancy vs seeker, images optional | listingType + optional images | None | n/a | Both types created without images; seeker shows «لا توجد صورة» | LIVE jobs fields + homepage nearby rail | **PASS** |
| 20 | Submission confirmation email all categories | `emailListingReceived` | None | n/a | Email received for cars, electronics, real-estate, furniture, jobs vacancy, jobs seeker, mobiles | 7/7 mailbox hits; Sooqna branding + sooqna.site | **PASS** |
| 21 | Password reset delay + new password | Confirm expects `newPassword` | None (script field name only) | n/a | Email 6.3s; confirm 200; old 401; new 200 | LIVE mailbox + login APIs | **PASS** |
| 22 | Stripe isolation / success UI | Keys unset; success copy Sooqna-neutral | None (no key changes) | n/a | `stripeConfigured=false`; all Stripe flags off; `/checkout/success` has no «عبر Stripe» | `/api/auth/status`; success HTML; no AviatorPass keys | **PASS** |
| 23 | Contact form | Support API | None | n/a | Invalid → 400 fieldErrors; valid → `{ok:true}` | `POST /api/support` | **PASS** |
| 24 | Header Emirate selector including جميع الإمارات | Had «كل الإمارات» | Relabel to «جميع الإمارات»; keep legacy storage | Preview Ready `dpl_25sbMkJ21xPiBUctno99WfCzcN6x` | LIVE hero value «جميع الإمارات»; `/search?city=أبوظبي` filters; header select persists أبوظبي | LIVE homepage + search | **PASS** |
| 25 | Abu Dhabi visuals | Hero photo-1661630804525 | None | n/a | Hero alt أبوظبي / Corniche photo; Yas Island + Abu Dhabi Corniche chips | LIVE homepage screenshot | **PASS** |
| 26 | Remove homepage escrow promo; keep escrow feature | Electronics rail said «مع ضمان مالي» | Reword homepage electronics description only | Preview: old copy gone; `/escrow` 200 | LIVE electronics: «إلكترونيات حديثة مع توثيق للبائعين وأسعار واضحة.»; no `/escrow` homepage promo href; footer policy kept; `/escrow` 200 | LIVE homepage + `/escrow` | **PASS** |

---

## Score

01 **PASS**  
02 **PASS**  
03 **PASS**  
04 **PASS**  
05 **PASS**  
06 **PASS**  
07 **PASS**  
08 **PASS**  
09 **PASS**  
10 **PASS**  
11 **PASS**  
12 **PASS**  
13 **PASS**  
14 **PASS**  
15 **PASS**  
16 **PASS**  
17 **PASS**  
18 **PASS**  
19 **PASS**  
20 **PASS**  
21 **PASS**  
22 **PASS**  
23 **PASS**  
24 **PASS**  
25 **PASS**  
26 **PASS**

26 Issues:  
PASS = 26  
FAIL = 0  
BLOCKED = 0

---

## Regression gates

Urgent removed = **PASS** (0 on home/search/detail; search condition has no Urgent)  
Featured = **PASS** (homepage «إعلانات مميزة»; DB `isFeatured`; `isListingFeaturedActive` respects `featuredUntil`)  
Mock business data = **PASS** (admin seed IDs = 0; QA listings are real DB rows)  
Uploaded media = **PASS** (seller PNG cover + gallery; jobs without media use «لا توجد صورة»)  
Auth E2E = **PASS**  
Password reset = **PASS**  
Project isolation = **PASS** (`dukkanify/sooqna.site`; AviatorPass NONE)

---

## Isolation (no secrets)

| Check | LIVE |
|---|---|
| App URL | `https://sooqna.site` |
| Database | postgres configured |
| Email | Resend configured; from `no-reply@sooqna.site` / Sooqna |
| Stripe | Not mixed; Sooqna project has no Stripe keys set (all three flags false) |
| Cron | Sooqna cron route exists; no AviatorPass cron values |
| Session | session secret configured; demo OTP off |
| AviatorPass | NONE |

Stripe/Cron secret values were not rotated and were not printed.

---

## Fixes shipped this run

Only two visible Production gaps were found:

1. **26** — Homepage electronics rail promoted «ضمان مالي». Copy changed; `/escrow` and listing/checkout escrow UI left in place.  
2. **24** — All-Emirates label aligned to «جميع الإمارات». Previous stored «كل الإمارات» still accepted.

Preview: `dpl_25sbMkJ21xPiBUctno99WfCzcN6x` (branch `qa/26-homepage-copy-fixes`).  
Then merged to `main` → Production `dpl_CmaBj5BtxcHgKVqxN29hPrWKFVqL`.

UAE-Sales was not used. AviatorPass was not touched. Secrets were not rotated.

---

## Production

Repository: `dukkanify/sooqna.site`  
Branch: `main`  
Commit: `c3dafb0bae1cc3db1a225f90d88a92e316a68015`  
Deployment ID: `dpl_CmaBj5BtxcHgKVqxN29hPrWKFVqL`  
Domain: `https://sooqna.site`

---

## Verdict

26/26 PASS  
FAIL 0  
BLOCKED 0  
PRODUCTION ACCEPTANCE COMPLETE
