"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isDemoMode, DEMO_SESSION_COOKIE } from "@/lib/mode";
import { ROUTES } from "@/config/routes";
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from "@/schemas/auth";
import { ValidationError, toErrorResult } from "@/server/errors";
import { signUpCustomer } from "@/data/accounts";
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
    const { error } = await supabaseServer().auth.signInWithPassword(parsed.data);
    if (error) return err("UNAUTHENTICATED", "That email or password isn't right.");
    return ok(null);
  } catch {
    return err("INTERNAL", "Couldn't sign in right now. Please try again.");
  }
}

/**
 * Customer self-signup: creates their company account + password login, then
 * signs them in.
 */
export async function signUpAction(input: SignUpInput): Promise<Result<null>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return toErrorResult(ValidationError.fromZod(parsed.error));
  try {
    await signUpCustomer(parsed.data);
    const { supabaseServer } = await import("@/lib/supabase/server");
    const { error } = await supabaseServer().auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) return err("INTERNAL", "Account created — please sign in.");
    return ok(null);
  } catch (e) {
    return toErrorResult(e);
  }
}
