import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isDemoMode, DEMO_SESSION_COOKIE } from "@/lib/mode";
import { COMPANY } from "@/config/company";
import { ROUTES } from "@/config/routes";

export default function NoAccessPage() {
  async function signOut() {
    "use server";
    if (isDemoMode()) {
      cookies().delete(DEMO_SESSION_COOKIE);
    } else {
      const { supabaseServer } = await import("@/lib/supabase/server");
      const supabase = supabaseServer();
      await supabase.auth.signOut();
    }
    redirect(ROUTES.login);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="mark">CG</div>
        <h1>Almost there</h1>
        <p className="sub">
          Your login isn&rsquo;t linked to an active account yet. Reach out to
          C&amp;G at {COMPANY.phone} and we&rsquo;ll get you connected.
        </p>
        <form action={signOut}>
          <button className="btn ghost wide" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
