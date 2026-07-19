# Going live with Supabase

The app runs in **Demo Mode** (in-memory data, one-click logins) until real
credentials exist. Adding them flips it to the real database automatically —
no code changes. Follow these steps in order.

## 1. Create the Supabase project
1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env`.
3. Fill in the five Supabase values in `.env` (blocks **1** and **2**):
   - `DATABASE_URL`, `DIRECT_URL` — Project Settings → Database → Connection string
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API

> The moment `DATABASE_URL` **and** `NEXT_PUBLIC_SUPABASE_URL` are set, the app
> leaves Demo Mode (`src/lib/mode.ts`).

## 2. Create the database schema
```bash
npx prisma migrate dev --name init   # creates all tables incl. settings
npm run db:seed                       # 7 colors, ~290 cabinets, 10 flooring SKUs, CG-001 account
```
Then, in the Supabase SQL editor, run **`prisma/rls.sql`** to enable Row Level
Security + CHECK constraints.

## 3. Create your logins (no self-registration by design)
```bash
npm run user:create -- you@company.com "Your Name" staff STAFF_ADMIN
npm run user:create -- buyer@test.com  "Test Buyer" CG-001 CUSTOMER_ADMIN
```

## 4. (Optional) Email
Add `RESEND_API_KEY` + a verified `EMAIL_FROM` (block **4**) to send real
staff/customer notifications. Without it, the app still works — it just
doesn't send email.

## 5. Run it
```bash
npm run dev        # http://localhost:3000  → magic-link login
npm run build      # production build (also runs lint + typecheck)
```

## Where each concern plugs in (for future work)
| Concern | Insertion point |
|---|---|
| Auth | `src/lib/supabase/server.ts`, `src/data/context.ts` (already wired) |
| Data access | `src/data/*.ts` — each function already has the Prisma branch |
| Settings persistence | `src/server/settings/settings-store.ts` — swap the in-memory store for the `Setting` table |
| File uploads | private bucket + signed URLs; `Attachment` model exists |

## Verify before shipping
```bash
npm run lint     # zero warnings (incl. the Prisma-import boundary rule)
npm test         # buildPipeline suite
npm run build    # green
```
