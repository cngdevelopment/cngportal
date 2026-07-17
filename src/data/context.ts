import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isDemoMode, DEMO_SESSION_COOKIE } from "@/lib/mode";
import { findUserById, MOCK_ACCOUNT } from "./mock/catalog-data";

export interface SessionContext {
  userId: string;
  email: string;
  fullName: string;
  role: "CUSTOMER_USER" | "CUSTOMER_ADMIN" | "STAFF" | "STAFF_ADMIN";
  /** null for staff users */
  accountId: string | null;
  accountName: string | null;
}

async function getDemoSessionContext(): Promise<SessionContext | null> {
  const userId = cookies().get(DEMO_SESSION_COOKIE)?.value;
  if (!userId) return null;
  const user = findUserById(userId);
  if (!user) return null;
  return {
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    accountId: user.accountId,
    accountName: user.accountId ? MOCK_ACCOUNT.name : null,
  };
}

async function getSupabaseSessionContext(): Promise<SessionContext | null> {
  const { supabaseServer } = await import("@/lib/supabase/server");
  const { prisma } = await import("./db");
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    include: { account: true },
  });
  if (!row || !row.isActive) return null;
  if (row.account && !row.account.isActive) return null;

  return {
    userId: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    accountId: row.accountId,
    accountName: row.account?.name ?? null,
  };
}

/**
 * Resolves the caller's identity server-side. In demo mode (no Supabase/DB
 * configured — see src/lib/mode.ts) this reads a lightweight session
 * cookie against the in-memory demo users instead. Either way,
 * account_id is NEVER accepted from the client (spec §5.2) — it comes
 * from here or nowhere.
 */
export async function getSessionContext(): Promise<SessionContext | null> {
  return isDemoMode() ? getDemoSessionContext() : getSupabaseSessionContext();
}

/** For customer-facing pages: requires a linked, active customer account. */
export async function requireCustomer(): Promise<
  SessionContext & { accountId: string }
> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/no-access");
  if (!ctx.accountId) redirect("/no-access");
  return ctx as SessionContext & { accountId: string };
}

/** For staff-facing pages: requires a staff login (no linked account). */
export async function requireStaff(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/no-access");
  if (ctx.role !== "STAFF" && ctx.role !== "STAFF_ADMIN") redirect("/dashboard");
  return ctx;
}
