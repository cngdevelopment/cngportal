import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client (service-role key). Server-only - the service-role
 * key bypasses Row Level Security and must never reach the browser. Used to
 * provision auth users when staff create a customer login.
 */
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
