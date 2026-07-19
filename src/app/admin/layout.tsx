import { requirePermission } from "@/server/auth/guards";
import { getSettings } from "@/server/settings/settings";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { ToastProvider } from "@/components/ui/Toast";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin is part of the same staff console — same chrome, gated on one permission.
  const ctx = await requirePermission("admin.access");
  const settings = await getSettings();
  return (
    <ConsoleShell companyName={settings.companyName} fullName={ctx.fullName} email={ctx.email} role={ctx.role}>
      <ToastProvider>{children}</ToastProvider>
    </ConsoleShell>
  );
}
