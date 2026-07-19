import { COMPANY } from "@/config/company";
import { signOutAction } from "@/app/actions/auth";

export default function NoAccessPage() {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="mark">CG</div>
        <h1>Almost there</h1>
        <p className="sub">
          Your login isn&rsquo;t linked to an active account yet. Reach out to
          C&amp;G at {COMPANY.phone} and we&rsquo;ll get you connected.
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
