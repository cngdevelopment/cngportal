import { redirect } from "next/navigation";
import Image from "next/image";
import { getSettings } from "@/server/settings/settings";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { sent?: string };
}) {
  const settings = await getSettings();

  async function sendLink(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    if (email) {
      // shouldCreateUser:false — no self-registration (spec §4).
      // Both returned errors AND thrown errors are swallowed: never confirm
      // whether an email is registered (spec §8.1) and never crash the form.
      try {
        const { supabaseServer } = await import("@/lib/supabase/server");
        const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
        await supabaseServer().auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false, emailRedirectTo: `${base}/auth/confirm` },
        });
      } catch {
        // ignore — still show the neutral "check your email" screen
      }
    }
    redirect("/login?sent=1");
  }

  return (
    <div className="login-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <Image src="/cg-logo.png" alt={settings.companyName} width={104} height={104} priority />
          <div className="auth-brand">{settings.companyName}</div>
          <div className="auth-brand-sub">{settings.portalName}</div>
        </div>

        <div className="auth-body">
          {searchParams.sent ? (
            <div className="auth-sent">
              <div className="auth-sent-icon" aria-hidden="true">✓</div>
              <b>Check your email</b>
              <p>
                If an account exists for that address, we&rsquo;ve sent a secure
                sign-in link. It expires shortly and can only be used once.
              </p>
            </div>
          ) : (
            <form action={sendLink}>
              <div className="fgroup">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  className="field"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
              <button className="btn wide" type="submit">
                Email me a sign-in link
              </button>
              <p className="auth-hint">
                Passwordless &amp; secure — we email you a single-use link. No
                password to remember.
              </p>
            </form>
          )}

          <p className="auth-foot">
            Accounts are set up by C&amp;G. Need access? Call {settings.supportPhone}.
          </p>
        </div>
      </div>
    </div>
  );
}
