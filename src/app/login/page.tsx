import Image from "next/image";
import { getSettings } from "@/server/settings/settings";
import { AuthPanel } from "@/components/auth/AuthPanel";

export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <div className="login-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <Image src="/cg-logo.png" alt={settings.companyName} width={104} height={104} priority />
          <div className="auth-brand">{settings.companyName}</div>
          <div className="auth-brand-sub">{settings.portalName}</div>
        </div>

        <div className="auth-body">
          <AuthPanel />
          <p className="auth-foot">
            Need help? Call {settings.supportPhone}.
          </p>
        </div>
      </div>
    </div>
  );
}
