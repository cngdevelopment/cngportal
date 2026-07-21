import { signOutAction } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";

/**
 * Shown to customers while maintenance mode is on (Admin → Settings). Staff
 * bypass this entirely so the queue stays workable during downtime.
 */
export function MaintenanceScreen({
  companyName,
  supportPhone,
}: {
  companyName: string;
  supportPhone: string;
}) {
  return (
    <div className="login-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <Logo />
          <div className="auth-brand">{companyName}</div>
          <div className="auth-brand-sub">Temporarily offline</div>
        </div>
        <div className="auth-body">
          <p className="maintenance-copy">
            We&rsquo;re making some updates and ordering is paused for a short while. Please check
            back soon.
          </p>
          <p className="auth-foot">Need something urgently? Call {supportPhone}.</p>
          <form action={signOutAction}>
            <button className="btn ghost wide" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
