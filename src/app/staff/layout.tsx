import { requireStaff } from "@/data/context";
import { getSettings } from "@/server/settings/settings";
import { ConsoleShell } from "@/components/console/ConsoleShell";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStaff();
  const settings = await getSettings();
  return (
    <ConsoleShell
      companyName={settings.companyName}
      fullName={ctx.fullName}
      email={ctx.email}
      role={ctx.role}
      announcement={settings.announcement}
      maintenanceMode={settings.maintenanceMode}
    >
      {children}
    </ConsoleShell>
  );
}
