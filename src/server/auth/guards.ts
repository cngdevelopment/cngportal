import "server-only";
import { redirect } from "next/navigation";
import { getSessionContext, type SessionContext } from "@/data/context";
import { AuthenticationError, AuthorizationError } from "@/server/errors";
import { hasPermission, type Permission } from "./permissions";
import { ROUTES } from "@/config/routes";

/**
 * Server-side authorization guards, built on the session resolved in
 * src/data/context.ts. Two shapes:
 *
 *  - `requirePermission` for pages/layouts: redirects (login when signed
 *    out, home when lacking the permission) so the caller renders nothing.
 *  - `assertPermission` for Server Actions: throws a typed AppError that
 *    the action boundary maps to a Result, instead of redirecting.
 */

export async function requirePermission(permission: Permission): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) redirect(ROUTES.login);
  if (!hasPermission(ctx.role, permission)) redirect(ROUTES.home);
  return ctx;
}

export async function assertPermission(permission: Permission): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) throw new AuthenticationError();
  if (!hasPermission(ctx.role, permission)) throw new AuthorizationError();
  return ctx;
}
