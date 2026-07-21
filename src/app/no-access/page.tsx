import { getSettings } from "@/server/settings/settings";
import { signOutAction } from "@/app/actions/auth";

export default async function NoAccessPage() {
  const settings = await getSettings();

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="mark">CG</div>
        <h1>Almost there</h1>
        <p className="sub">
          Your login isn&rsquo;t linked to an active account yet. Reach out to{" "}
          {settings.companyName} at {settings.supportPhone} and we&rsquo;ll get you connected.
        </p>
        <form action={signOutAction}>
          <button className="btn ghost wide" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
