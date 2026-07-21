# C&G Wholesale Portal - Build Plan

Companion to `CG-Wholesale-Portal-Build-Spec.md` v1.3. The spec is the contract; this is the order of operations to get it built without rework. Written for one developer working with Claude Code (adapt the spec's two-engineer split accordingly - same milestones, sequential instead of parallel where noted).

---

## 0. Prerequisites (do these before writing feature code - ~1 hour)

| # | Item | Where |
|---|---|---|
| 1 | Supabase project (free tier is fine at this scale) | supabase.com - grab `DATABASE_URL`, `SUPABASE_URL`, anon + service keys |
| 2 | Resend account + API key, verify sending domain | resend.com |
| 3 | Vercel project linked to the repo | vercel.com |
| 4 | Sentry project (can defer to week 5) | sentry.io |
| 5 | GitHub repo, `main` protected, PR previews on | github.com |

Cost note for Andrew's reimbursement question: at this scale (dozens of accounts, hundreds of orders/month) the recurring cost is roughly $0-45/month - Supabase free or Pro ($25), Vercel Hobby free or Pro ($20), Resend free tier (3k emails/month) almost certainly suffices, Sentry free tier. Domain ~$12/year. Realistically this runs free-to-cheap for a long time.

## 1. Gap resolutions (spec §16) - several already answered

| Gap | Status |
|---|---|
| Warehouse pickup address | **Resolved:** 9150 Latty Ave, Berkeley, MO 63134 · 314-838-8588 (from flyer). Hours still needed → config constant. |
| Color list + swatches | **Resolved from flyer**, with two name corrections vs Appendix A: **"Natural Wood"** (not "Natural Shaker") and **"Pearl Glazed"** (not "Pearl Shaker"). Seed uses flyer names - confirm with Andrew Friday. Swatches croppable from the flyer PDF. |
| Cabinet SKU list | **Resolved:** Jan-26 Cabinet Price Sheet imported - ~290 SKUs across base/wall/tall/vanity cabinets, moldings, fillers, panels, and hardware, each with a retail price (`src/data/mock/catalog-data.ts`). |
| Flooring `units_per_box` | Fallback 23.4 sq ft for all 10, per spec. |
| Domain, staff recipients, logo, hours | Batch to Andrew/John Friday. All are config/env swaps. |

## 2. Order of work

The spec's three rewrite-risk sections come first, as code you can test before any UI exists.

### Week 1 - Foundation (scaffold in this folder is your starting point)
1. `create-next-app` (App Router + TS + Tailwind), add shadcn/ui, Prisma.
2. Apply `prisma/schema.prisma` (already written here - full §6 model, no price columns anywhere). Migrate against Supabase.
3. Run `prisma/seed.ts` - 7 colors, 10 flooring SKUs with thickness options (JP1003/JP1008 dual-value), 20 placeholder cabinets.
4. `buildPipeline()` (already written + tested here) - drop into `src/lib/pipeline/`.
5. Supabase Auth magic-link flow; `users` row keyed to auth user; role enum.
6. Data-access layer: every function takes `accountId` resolved server-side, `staffContext()` escape hatch, ESLint rule banning Prisma imports outside `src/data/`.
7. Enable RLS on every tenant table (policies in `prisma/rls.sql` here - review before applying).

### Week 2 - Catalog
8. Catalog browse: Cabinets | Flooring tabs, subcategory/color/thickness filters, search.
9. Product slide-over: color swatch grid (required), assembly segmented control (required, **no default**), thickness picker (real picker only for JP1003/JP1008), quantity stepper per §9 spec.
10. Catalog admin CRUD (staff) - lets you import the real SKU sheet the moment Andrew's file is parsed.

### Week 3 - Cart & submit
11. Server-persisted `DRAFT` order as cart. Line merge rule: same product+color+thickness+assembly increments; otherwise new line.
12. Cart review: bulk assembly control, delivery-method segmented control (no default), ship-to vs pickup-contact conditional fields, PO required, plain-English fulfillment summary line, confirm modal.
13. Submit → status `SUBMITTED` + event row (same transaction) + Resend emails.

### Week 4 - Pipeline & staff tools
14. Transition map derived from `buildPipeline()`; server-side validator; backward-one-step with required reason; ON_HOLD/CANCELLED.
15. Progress bar component that renders whatever `buildPipeline()` returns - zero rules in the component.
16. Staff queue (kanban + table), one-click "assembled + not yet built" filter, order detail with status advance, line amendments (event-logged), two separate composers for internal notes vs customer messages.
17. All notification templates, Ready-for-Pickup first.

### Week 5 - Everything else
18. Messages, attachments (private bucket + signed URLs + authz check), history + CSV export (no price columns), account settings, accounts admin, exports.
19. Tablet/responsive pass (768px+, 44px touch targets), accessibility pass.

### Week 6 - Hardening & launch
20. Isolation test suite (automated: Account A hitting Account B's order/attachment/message/export → 404, not 403).
21. Pipeline unit tests in CI (already written here). Backup restore drill. Seed real accounts. Launch on real domain.

## 3. Definition-of-done gates to wire into CI early

- ESLint rule: no `@prisma/client` import outside `src/data/`.
- Vitest: `buildPipeline` 4-variant test (included in scaffold).
- Isolation tests (week 6, but write the harness in week 1 while auth is fresh).

## 4. Questions to batch for Andrew/John (one message, per §16)

1. Color names: flyer says "Natural Wood" / "Pearl Glazed" - spec says "Natural Shaker" / "Pearl Shaker". Which are canonical?
2. Warehouse pickup hours.
3. Portal domain.
4. Staff notification email list.
5. Logo/brand files (flyer logo is low-res - need source asset).
6. Confirm the SKU sheet attachment is the final cabinet list (names + sizes only, no prices - matches spec).
