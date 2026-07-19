"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isDemoMode, DEMO_SESSION_COOKIE } from "@/lib/mode";
import { ROUTES } from "@/config/routes";

/**
 * Sign out and return to the login screen. Shared by every layout's
 * sign-out form (portal, staff, admin, no-access) — previously duplicated
 * inline in each.
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
