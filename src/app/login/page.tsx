import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Image from "next/image";
import { isDemoMode, DEMO_SESSION_COOKIE } from "@/lib/mode";
import { MOCK_USERS } from "@/data/mock/catalog-data";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { sent?: string };
}) {
  const demo = isDemoMode();

  async function demoLogin(formData: FormData) {
    "use server";
    const userId = String(formData.get("userId") ?? "");
    const user = MOCK_USERS.find((u) => u.id === userId);
    if (!user) redirect("/login");
    cookies().set(DEMO_SESSION_COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect(user.accountId ? "/dashboard" : "/staff/queue");
  }

  async function sendLink(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    if (email) {
      const { supabaseServer } = await import("@/lib/supabase/server");
      const supabase = supabaseServer();
      // shouldCreateUser:false — no self-registration (spec §4).
      // Errors are deliberately swallowed: never confirm whether an
      // email is registered (spec §8.1).
      await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
        },
      });
    }
    redirect("/login?sent=1");
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <Image src="/cg-logo.png" alt="C&amp;G Wholesale" width={64} height={64} className="login-logo" priority />
        <h1>C&amp;G Wholesale</h1>
        <p className="sub">Ordering portal for wholesale accounts</p>

        {demo && (
          <div className="demo-box">
            <div className="demo-tag">Demo Mode</div>
            <p>
              No Supabase/database keys are configured yet, so this preview
              runs on sample data. Sign in as one of the demo logins below —
              add real keys to <code>.env</code> later to switch to live
              accounts and magic-link email.
            </p>
            {MOCK_USERS.map((u) => (
              <form action={demoLogin} key={u.id}>
                <input type="hidden" name="userId" value={u.id} />
                <button className="btn wide demo-btn" type="submit">
                  Continue as {u.fullName}
                  <small>{u.accountId ? "Customer — Demo Builders LLC" : "C&G Staff"}</small>
                </button>
              </form>
            ))}
          </div>
        )}

        {!demo &&
          (searchParams.sent ? (
            <div className="notice">
              If an account exists for that email, a sign-in link has been
              sent. Check your inbox.
            </div>
          ) : (
            <form action={sendLink}>
              <div className="fgroup">
                <label htmlFor="email">Work email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="field"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
              <button className="btn wide" type="submit">
                Email me a sign-in link
              </button>
            </form>
          ))}

        <p className="meta" style={{ marginTop: 16, textAlign: "center" }}>
          No passwords. Accounts are created by C&amp;G — call 314-838-8588 to
          get set up.
        </p>
      </div>
    </div>
  );
}
