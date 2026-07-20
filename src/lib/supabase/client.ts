"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser. Only used where the client genuinely needs
 * to talk to Supabase Auth directly — e.g. completing a password-recovery
 * session on /reset-password. Everything else goes through the server client.
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
