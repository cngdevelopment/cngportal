/**
 * Demo mode: true whenever real Supabase/Postgres credentials aren't
 * configured. Lets the whole app run with zero external setup — an
 * in-memory data store stands in for Prisma/Supabase (src/data/mock/*).
 *
 * Add real values to .env (see .env.example) and this flips off on its
 * own; no code changes needed.
 *
 * Edge-safe: only reads env vars, never imports Prisma/Node-only code,
 * so it can be called from middleware.
 */
export function isDemoMode(): boolean {
  return !process.env.DATABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/** Cookie holding the logged-in demo user id (demo mode only). */
export const DEMO_SESSION_COOKIE = "cg_demo_session";
