# C&G Global Ordering Portal

Customer ordering portal per `docs/BUILD_PLAN.md` and the v1.3 build spec.
The approved look/interaction reference is `prototype/cg-portal-prototype.html`
(open it in a browser - it runs standalone).

## Preview it right now - no setup required

There's no `.env` yet, which puts the app in **Demo Mode**: an in-memory
data store stands in for Supabase/Postgres, so the whole app runs with
just:

```bash
npm install
npm run dev        # http://localhost:3000
```

The login screen shows two one-click logins instead of the magic-link
form - "Jordan Ellis" (a customer buyer on Meridian Builders LLC) and "C&G
Staff" (staff console). Sign in as either to click through the full flow:
browse the catalog, add cabinets/flooring to an order, submit it, watch it
move through the pipeline, and - as staff - advance/hold/send back orders
and message customers.

Demo data (the full ~290-SKU
cabinet catalog, 10 flooring SKUs, colors) lives in `src/data/mock/` and
resets whenever the dev server restarts.

## Switching to real accounts (Supabase + Resend)

Demo Mode turns itself off automatically the moment real credentials are
present - no code changes needed (see `src/lib/mode.ts`).

```bash
cp .env.example .env      # fill in the Supabase values
npx prisma migrate dev --name init
npm run db:seed           # 7 colors, ~290 cabinets, 10 flooring SKUs, CG-001 account
```

Apply `prisma/rls.sql` in the Supabase SQL editor (Dashboard → SQL) after the
first migration - it adds Row Level Security and the CHECK constraints.

Create your first logins (no self-registration by design):

```bash
npm run user:create -- you@email.com "Your Name" staff STAFF_ADMIN
npm run user:create -- buyer@test.com "Test Buyer" CG-001 CUSTOMER_ADMIN
```

Then:

```bash
npm run dev        # http://localhost:3000
npm test           # buildPipeline suite (§12.9)
```

Log in with the magic link (in local dev, Supabase logs the email in
Dashboard → Authentication → Logs if you haven't wired SMTP; the hosted
Supabase default sender works out of the box for low volume). Add
`RESEND_API_KEY` to send real staff/customer notification emails.

## What's built

- **Demo Mode** (`src/lib/mode.ts`, `src/data/mock/`): zero-setup preview
  backend, auto-disabled once `DATABASE_URL` + Supabase keys are set.
- Auth: demo quick-login in Demo Mode; magic-link + middleware session
  guard + no-account screen once Supabase is configured. No email
  enumeration on the login form.
- Tenant isolation: `src/data/` layer resolves `account_id` from the
  session only; scoped queries return not-found (never forbidden) for
  foreign UUIDs; RLS backstop in `prisma/rls.sql`.
- Schema + seed: full §6 model, snapshots on line items, catalog products
  carry a retail price (Jan-26 cabinet price sheet).
- Pipeline: `buildPipeline()` + tests; ProgressBar/StatusChip render only
  what it returns.
- Customer pages: dashboard, catalog browse with product slide-over
  (finish swatches, assembly segmented control, thickness picker,
  quantity stepper), server-persisted-style cart with bulk assembly and
  delivery-method controls, submit with confirm modal, order detail with
  progress bar + pickup panel + messages, reorder, cancel, order history.
- Staff console (`/staff/queue`, `/staff/orders/[id]`): cross-account
  queue with one-click "assembled & not yet built" filter, status
  advance/send-back (reason required)/hold/resume/cancel, event log,
  separate internal-note vs customer-message composers.
- Branding: C&G logo in the header, login screen, and browser favicon.

## Next up (in order)

1. Attachments (private bucket + signed URLs + authz check).
2. Resend email templates (Ready-for-Pickup first) - Demo Mode surfaces
   the same in-app events but doesn't send real email.
3. Accounts admin + catalog admin CRUD for staff.
4. Tablet/responsive + accessibility pass.

## House rules (from the spec)

Everything always in stock · assembly per line, delivery per order ·
`account_id` never from the client · no status change without an event
row · `buildPipeline()` is the only source of pipeline truth · required
choices have no defaults. (Spec §2 rule 6, "no prices anywhere," was
lifted - the catalog now shows retail prices and the cart shows a
subtotal; there's still no payment flow, invoicing stays off-portal.)

## Note on OneDrive

This folder lives in OneDrive. `node_modules` is heavy and churns on every
install - consider telling OneDrive to ignore it (Settings → Sync and backup
→ Advanced) or moving the project to a plain folder like `C:\dev\CGPortal`
if sync gets noisy. Git + GitHub is the real backup once we init the repo.
