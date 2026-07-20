"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isDemoMode, DEMO_SESSION_COOKIE } from "@/lib/mode";
import { ROUTES } from "@/config/routes";
import { signInSchema, passwordResetRequestSchema, type SignInInput, type PasswordResetRequestInput } from "@/schemas/auth";
import { ValidationError, toErrorResult } from "@/server/errors";
import { recordLastLogin } from "@/data/context";
import { type Result, ok, err } from "@/lib/result";

/**
 * Sign out and return to the login screen. Shared by every layout's
 * sign-out form (portal, staff, admin, no-access).
 */
export async function signOutAction() {
  if (isDemoMode()) {
    cookies().delete(DEMO_SESSION_COOKIE);
  } else {
    const { supabaseServer } = await import("@/lib/supabase/server");
    await supabaseServer().auth.signOut();
  }
  redirect(ROUTES.login);
}

/**
 * Email + password sign-in. Sets the session cookie on success; the client
 * then navigates to "/" which routes by role. Returns the standard Result so
 * the form can show inline errors. (No redirect here — that would be swallowed
 * by the client's action call.)
 */
export async function signInAction(input: SignInInput): Promise<Result<null>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return toErrorResult(ValidationError.fromZod(parsed.error));
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const { data, error } = await supabaseServer().auth.signInWithPassword(parsed.data);
    if (error || !data.user) return err("UNAUTHENTICATED", "That email or password isn't right.");
    await recordLastLogin(data.user.id).catch(() => {});
    return ok(null);
  } catch {
    return err("INTERNAL", "Couldn't sign in right now. Please try again.");
  }
}

/**
 * "Forgot password" — sends a Supabase recovery email that lands on
 * /reset-password. Always reports success (even for unknown emails) so the
 * form never reveals whether an account exists.
 */
export async function requestPasswordResetAction(input: PasswordResetRequestInput): Promise<Result<null>> {
  const parsed = passwordResetRequestSchema.safeParse(input);
  if (!parsed.success) return toErrorResult(ValidationError.fromZod(parsed.error));
  if (isDemoMode()) return ok(null);
  try {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    await supabaseServer().auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${base}${ROUTES.resetPassword}`,
    });
    return ok(null);
  } catch {
    // Never surface whether the address exists.
    return ok(null);
  }
}
